/*
   Copyright 2025 Marc Nuri San Felix

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

/**
 * Convert key string to virtual key code for CDP Input.dispatchKeyEvent
 * https://docs.microsoft.com/en-us/windows/win32/inputdev/virtual-key-codes
 */
function toVirtualKeyCode(key) {
  const keyCodes = {
    F5: 116,
    F11: 122,
    F12: 123,
    Escape: 27,
    Tab: 9,
    Enter: 13,
    0: 48,
    1: 49,
    2: 50,
    3: 51,
    4: 52,
    5: 53,
    6: 54,
    7: 55,
    8: 56,
    9: 57,
    '+': 187,
    '-': 189,
    '=': 187,
    F: 70,
    f: 70,
    R: 82,
    r: 82
  };
  return keyCodes[key] || key.codePointAt(0);
}

const {kill: killApp} = require('./e2e-watchdog');

// Playwright starts the application in a session of its own, so an interrupted run leaves the whole
// application behind: the Ctrl+C goes to the runner's process group and never reaches it. It cannot
// be cleaned up from here either, because jest hands tests a copy of `process` whose signal and exit
// handlers never see the real ones. A detached watchdog does it from outside jest instead.
const startWatchdog = appPid => {
  const {spawn} = require('node:child_process');
  const path = require('node:path');
  const watchdog = spawn(
    process.execPath,
    [path.resolve(__dirname, 'e2e-watchdog.js'), String(process.pid), String(appPid)],
    {detached: true, stdio: 'ignore'}
  );
  // Without a listener a failed spawn raises an unhandled 'error' event, which would take the whole
  // run down over a best-effort safety net. Losing the watchdog only costs cleanup on an
  // interrupted run, so report it and carry on.
  watchdog.on('error', error => console.warn('E2E watchdog could not be started', error));
  watchdog.unref();
  return watchdog;
};

const spawnElectron = async ({extraArgs = [], settings} = {}) => {
  const {_electron: electron} = require('playwright');
  const path = require('node:path');
  const fs = require('node:fs');
  const os = require('node:os');
  // Set environment for testing
  process.env.NODE_ENV = 'test';
  process.env.DISPLAY = process.env.DISPLAY || ':99';
  process.env.ELECTRON_IS_DEV = '0';
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

  // Set up temporary settings directory for test isolation
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'electronim-test-'));
  const settingsPath = path.join(tempDir, 'settings.json');

  // Only create settings file if settings object is provided
  if (settings) {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  }

  const appPath = path.join(__dirname, '..', 'index.js');
  const electronApp = await electron.launch({
    args: [
      appPath,
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--settings-path',
      settingsPath,
      '--user-data',
      tempDir,
      ...extraArgs
    ],
    env: {...process.env}
  });

  if (electronApp.process()?.pid) {
    startWatchdog(electronApp.process().pid);
  }

  const instance = {
    tempDir,
    app: electronApp,
    kill: async () => {
      // First kill the electron process to release any file locks
      if (electronApp?.process()?.pid) {
        // eslint-disable-next-line no-warning-comments
        // TODO: electronApp.close() doesn't work when tray icon is enabled, using SIGKILL directly
        // This is because the tray prevents graceful shutdown. Consider adding a test-specific
        // flag to disable tray in E2E tests for proper graceful shutdown testing.
        // await electronApp.close();
        killApp(electronApp.process().pid);
        // Wait a bit for process to fully terminate and release file handles
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      // Clean up temporary directory
      if (instance.tempDir && fs.existsSync(instance.tempDir)) {
        try {
          fs.rmSync(instance.tempDir, {recursive: true, force: true});
        } catch {
          // Ignore cleanup errors
        }
      }
    },
    /**
     * Wait for a window matching the filter criteria and waits for it to be loaded
     * @param {Function} filterFn - Function that receives {url, title, window} and returns true when window is found
     * @param {Object} options - Options for waiting
     * @param {number} options.timeout - Maximum time to wait in ms (default: 10000)
     * @param {string} options.loadState - Load state to wait for: 'load', 'domcontentloaded', or 'networkidle' (default: 'load')
     * @returns {Promise<Object>} The Playwright window object that matches the filter
     * @throws {Error} If no matching window is found within the timeout period or if window fails to load
     */
    waitForWindow: async (filterFn, {
      timeout = 10000,
      loadState = 'load'
    } = {}) => {
      const foundWindow = await instance.waitForCondition(
        async () => {
          const windows = electronApp.windows();
          for (const win of windows) {
            const url = win.url();
            const title = await win.title();
            if (filterFn({url, title, window: win})) {
              return win;
            }
          }
          return null;
        },
        {
          timeout,
          interval: 100,
          message: 'Window matching filter not found'
        }
      );
      await foundWindow.waitForLoadState(loadState, {timeout});

      return foundWindow;
    },
    /**
     * Get the currently active tab's data-tab-id attribute
     * @param {Object} window - The Playwright window object
     * @returns {Promise<string>} The active tab's ID
     */
    getActiveTabId: async window => {
      const activeTab = window.locator('.chrome-tab[active]').first();
      await activeTab.waitFor({state: 'attached', timeout: 15000});
      return await activeTab.getAttribute('data-tab-id');
    },
    /**
     * Wait for the active tab to change to a specific tab ID
     * @param {Object} window - The Playwright window object
     * @param {string} expectedTabId - The expected tab ID
     */
    waitForActiveTab: async (window, expectedTabId) => {
      await instance.waitForCondition(
        async () => (await instance.getActiveTabId(window)) === expectedTabId,
        {timeout: 15000, message: `Active tab did not change to ${expectedTabId}`}
      );
    },
    /**
     * Send keyboard input via CDP (Chrome DevTools Protocol)
     * This triggers native keyboard events that Electron's before-input-event will catch
     * @param {Object} window - Optional Playwright window object. If not provided, uses the first available window
     * @param {string} key - The key to send
     * @param {Array<string>} modifiers - Optional array of modifier keys (e.g., ['control', 'shift'])
     */
    sendKeys: async ({window, key, modifiers = []}) => {
      const targetWindow = window || electronApp.windows()[0];

      if (!targetWindow) {
        throw new Error('No windows available to send keys to');
      }

      const cdpSession = await targetWindow.context().newCDPSession(targetWindow);

      // Map modifier names to CDP modifier values
      const modifierBits = modifiers.reduce((bits, mod) => {
        const modMap = {
          alt: 1,
          control: 2,
          meta: 4,
          shift: 8
        };
        return bits | (modMap[mod.toLowerCase()] || 0);
      }, 0);

      // Generate proper key code for CDP
      const keyCode = key.length === 1 && key >= 'a' && key <= 'z' ? `Key${key.toUpperCase()}` : key;
      const text = key.length === 1 ? key : '';

      // Send rawKeyDown event
      await cdpSession.send('Input.dispatchKeyEvent', {
        type: 'rawKeyDown',
        key: key,
        code: keyCode,
        text: text,
        windowsVirtualKeyCode: toVirtualKeyCode(key),
        nativeVirtualKeyCode: toVirtualKeyCode(key),
        modifiers: modifierBits
      });

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 50));

      // Send keyUp event
      await cdpSession.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: key,
        code: keyCode,
        windowsVirtualKeyCode: toVirtualKeyCode(key),
        nativeVirtualKeyCode: toVirtualKeyCode(key),
        modifiers: modifierBits
      });

      await cdpSession.detach();

      // Wait for event to be processed
      await new Promise(resolve => setTimeout(resolve, 100));
    },
    /**
     * Get the first window's fullscreen state
     */
    isFullScreen: async () => {
      const windows = electronApp.windows();
      if (windows.length === 0) {
        throw new Error('No windows available');
      }
      // Use evaluate to check the window's fullscreen state
      // BaseWindow.getAllWindows() returns all BaseWindow instances
      return await electronApp.evaluate(async ({BaseWindow}) => {
        const window = BaseWindow.getAllWindows()[0];
        return window ? window.isFullScreen() : false;
      });
    },
    /**
     * Check if find-in-page dialog is currently open
     */
    isFindInPageOpen: async () => {
      return await electronApp.evaluate(async ({BaseWindow}) => {
        const window = BaseWindow.getAllWindows()[0];
        if (!window) {
          return false;
        }
        // Access the BaseWindow's contentView to check for find-in-page dialog
        // The contentView property exists on BaseWindow instances
        const contentView = window.contentView;
        if (!contentView?.children) {
          return false;
        }
        // Check if any child view has the isFindInPage property
        return contentView.children.some(child => child.isFindInPage === true);
      });
    },
    /**
     * Check if the app menu is currently ATTACHED to the main window.
     *
     * Distinct from "an app-menu window exists": the menu is built ahead of the click and lives as
     * an unattached view until it is opened, so a renderer with the app-menu URL can be present
     * while the menu is closed. Only attachment says it was actually opened.
     *
     * Note this still cannot say the menu is VISIBLE - an attached view can composite nothing while
     * its renderer stays healthy. See the comment in app-menu.test.e2e.js.
     */
    isAppMenuOpen: async () => {
      return await electronApp.evaluate(async ({BaseWindow}) => {
        const window = BaseWindow.getAllWindows()[0];
        if (!window) {
          return false;
        }
        const contentView = window.contentView;
        if (!contentView?.children) {
          return false;
        }
        return contentView.children.some(child => child.isAppMenu === true);
      });
    },
    /**
     * Wait for a condition to be true with polling
     * @param {Function} conditionFn - Async function that returns a truthy value when condition is met
     * @param {Object} options - Options for waiting
     * @param {number} options.timeout - Maximum time to wait in ms (default: 5000)
     * @param {number} options.interval - Polling interval in ms (default: 100)
     * @param {string} options.message - Error message if timeout is reached
     * @returns {Promise<*>} The truthy value returned by conditionFn, or throws if timeout is reached
     */
    waitForCondition: async (conditionFn, {timeout = 5000, interval = 100, message = 'Condition not met'} = {}) => {
      const startTime = Date.now();
      while (Date.now() - startTime < timeout) {
        const result = await conditionFn();
        if (result) {
          return result;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }
      throw new Error(`${message} (timeout after ${timeout}ms)`);
    },
    /**
     * Get the zoom factor for a window
     * @param {Object} window - The Playwright window object
     * @returns {Promise<number>} The zoom factor (1.0 = 100%)
     */
    getZoom: async window => {
      // Get the window's URL to identify which webContents it is
      const windowUrl = window.url();

      return await electronApp.evaluate(async ({webContents}, url) => {
        // Find the webContents with matching URL
        const allWebContents = webContents.getAllWebContents();
        const matchingWebContents = allWebContents.find(wc => {
          try {
            return wc.getURL() === url;
          } catch {
            return false;
          }
        });

        if (matchingWebContents) {
          return matchingWebContents.getZoomFactor();
        }

        // Fallback to 1.0 if not found
        return 1.0;
      }, windowUrl);
    }
  };

  return instance;
};

module.exports = {spawnElectron};
