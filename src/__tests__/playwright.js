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
 * Get virtual key code for common keys
 * https://docs.microsoft.com/en-us/windows/win32/inputdev/virtual-key-codes
 */
function getVirtualKeyCode(key) {
  const keyCodes = {
    F11: 122,
    F12: 123,
    Escape: 27,
    Tab: 9,
    Enter: 13,
    1: 49,
    2: 50,
    3: 51,
    4: 52,
    5: 53,
    6: 54,
    7: 55,
    8: 56,
    9: 57,
    0: 48,
    F: 70,
    f: 70
  };
  return keyCodes[key] || key.charCodeAt(0);
}

const spawnElectron = async ({extraArgs = [], settings} = {}) => {
  const {_electron: electron} = require('playwright');
  const path = require('node:path');
  const fs = require('node:fs');
  const os = require('node:os');
  // Add playwright global expectations
  // Extend Jest's expect with Playwright matchers
  const {expect: playwrightExpect} = require('@playwright/test');
  globalThis.expect = Object.assign(globalThis.expect, playwrightExpect);
  // Set environment for testing
  process.env.NODE_ENV = 'test';
  process.env.DISPLAY = process.env.DISPLAY || ':99';
  process.env.ELECTRON_IS_DEV = '0';
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

  // Set up temporary settings file if settings object is provided
  let tempDir;
  let settingsPath;
  if (settings) {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'electronim-test-'));
    settingsPath = path.join(tempDir, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    extraArgs = [...extraArgs, '--settings-path', settingsPath];
  }

  const appPath = path.join(__dirname, '..', 'index.js');
  const electronApp = await electron.launch({
    args: [
      appPath,
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      ...extraArgs
    ],
    env: {...process.env}
  });

  const instance = {
    tempDir,
    app: electronApp,
    kill: async () => {
      // Clean up temporary settings directory if it was created
      if (instance.tempDir && fs.existsSync(instance.tempDir)) {
        fs.rmSync(tempDir, {recursive: true});
      }
      if (electronApp?.process()?.pid) {
        try {
          // eslint-disable-next-line no-warning-comments
          // TODO: electronApp.close() doesn't work when tray icon is enabled, using SIGKILL directly
          // This is because the tray prevents graceful shutdown. Consider adding a test-specific
          // flag to disable tray in E2E tests for proper graceful shutdown testing.
          // await electronApp.close();
          process.kill(electronApp?.process()?.pid, 'SIGKILL');
        } catch {
          // Process already dead
        }
      }
    },
    waitForWindow: async (filterFn, timeout = 10000) => {
      const startTime = Date.now();
      while (Date.now() - startTime < timeout) {
        const windows = electronApp.windows();
        for (const window of windows) {
          const url = window.url();
          const title = await window.title();
          if (filterFn({url, title, window})) {
            return window;
          }
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      throw new Error(`Window matching filter not found within ${timeout}ms`);
    },
    /**
     * Send keyboard input via CDP (Chrome DevTools Protocol)
     * This triggers native keyboard events that Electron's before-input-event will catch
     */
    sendKeys: async (key, modifiers = []) => {
      // Get the first window's CDP session
      const windows = electronApp.windows();
      if (windows.length === 0) {
        throw new Error('No windows available to send keys to');
      }

      const window = windows[0];
      const cdpSession = await window.context().newCDPSession(window);

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
        windowsVirtualKeyCode: getVirtualKeyCode(key),
        nativeVirtualKeyCode: getVirtualKeyCode(key),
        modifiers: modifierBits
      });

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 50));

      // Send keyUp event
      await cdpSession.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: key,
        code: keyCode,
        windowsVirtualKeyCode: getVirtualKeyCode(key),
        nativeVirtualKeyCode: getVirtualKeyCode(key),
        modifiers: modifierBits
      });

      await cdpSession.detach();

      // Wait for event to be processed
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  return instance;
};

module.exports = {spawnElectron};
