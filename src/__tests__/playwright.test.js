/**
 * @jest-environment node
 */
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

const {spawnElectron, createTestServer} = require('./');

jest.setTimeout(30000);

describe('Playwright utilities test suite', () => {
  let sharedTestServer;

  beforeAll(async () => {
    sharedTestServer = await createTestServer({manualCleanup: true});
  });

  afterAll(async () => {
    if (sharedTestServer) {
      await sharedTestServer.close();
    }
  });

  describe('spawnElectron', () => {
    describe('basic instance functionality', () => {
      let electron;

      beforeAll(async () => {
        electron = await spawnElectron({
          settings: {
            tabs: [{id: 'test', url: sharedTestServer.url, name: 'Test'}]
          }
        });
      });

      afterAll(async () => {
        await electron.kill();
      });

      test('creates electron app instance', () => {
        expect(electron.app).toBeDefined();
      });

      test('app has windows method', () => {
        expect(typeof electron.app.windows).toBe('function');
      });

      test('app returns array of windows', () => {
        const windows = electron.app.windows();
        expect(Array.isArray(windows)).toBe(true);
      });

      test('creates at least one window', async () => {
        // Wait for window to be created
        await electron.waitForWindow(() => true);
        const windows = electron.app.windows();
        expect(windows.length).toBeGreaterThan(0);
      });

      test('instance has kill method', () => {
        expect(typeof electron.kill).toBe('function');
      });

      test('instance has waitForWindow method', () => {
        expect(typeof electron.waitForWindow).toBe('function');
      });

      test('instance has sendKeys method', () => {
        expect(typeof electron.sendKeys).toBe('function');
      });

      test('instance has isFullScreen method', () => {
        expect(typeof electron.isFullScreen).toBe('function');
      });

      test('instance has isFindInPageOpen method', () => {
        expect(typeof electron.isFindInPageOpen).toBe('function');
      });

      test('instance has waitForCondition method', () => {
        expect(typeof electron.waitForCondition).toBe('function');
      });

      test('instance has getActiveTabId method', () => {
        expect(typeof electron.getActiveTabId).toBe('function');
      });

      test('instance has waitForActiveTab method', () => {
        expect(typeof electron.waitForActiveTab).toBe('function');
      });
    });
    describe('with custom settings', () => {
      let electron;
      let testServer;

      beforeAll(async () => {
        testServer = await createTestServer({manualCleanup: true});
        electron = await spawnElectron({
          settings: {
            tabs: [{id: 'custom-tab', url: testServer.url, name: 'Custom Tab'}]
          }
        });
      });

      afterAll(async () => {
        await Promise.all([electron.kill(), testServer.close()]);
      });

      test('temporary settings directory is created', () => {
        expect(electron.tempDir).toBeDefined();
      });

      test('temporary directory exists on filesystem', () => {
        const fs = require('node:fs');
        expect(fs.existsSync(electron.tempDir)).toBe(true);
      });

      test('settings file exists in temp directory', () => {
        const fs = require('node:fs');
        const path = require('node:path');
        const settingsPath = path.join(electron.tempDir, 'settings.json');
        expect(fs.existsSync(settingsPath)).toBe(true);
      });

      test('settings file contains correct configuration', () => {
        const fs = require('node:fs');
        const path = require('node:path');
        const settingsPath = path.join(electron.tempDir, 'settings.json');
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        expect(settings.tabs[0].id).toBe('custom-tab');
      });
    });
    describe('with extra arguments', () => {
      let electron;

      beforeAll(async () => {
        electron = await spawnElectron({
          extraArgs: ['--disable-extensions'],
          settings: {
            tabs: [{id: 'test', url: sharedTestServer.url, name: 'Test'}]
          }
        });
      });

      afterAll(async () => {
        await electron.kill();
      });

      test('application starts with extra arguments', () => {
        expect(electron.app).toBeDefined();
      });

      test('windows are created despite extra arguments', async () => {
        // Wait for window to be created
        await electron.waitForWindow(() => true);
        const windows = electron.app.windows();
        expect(windows.length).toBeGreaterThan(0);
      });
    });
  });

  describe('API', () => {
    let electron;
    let mainWindow;

    beforeAll(async () => {
      electron = await spawnElectron({
        settings: {
          tabs: [{id: 'test', url: sharedTestServer.url, name: 'Test'}]
        }
      });
      mainWindow = await electron.waitForWindow(
        ({url, title}) => url.includes('chrome-tabs') || title === 'ElectronIM tabs'
      );
    });

    afterAll(async () => {
      await electron.kill();
    });

    beforeEach(async () => {
      // Trigger close dialog to ensure no modals are open before each test
      await electron.app.evaluate(({ipcMain}) => {
        ipcMain.emit('closeDialog');
      });
    });

    describe('waitForWindow', () => {
      test('finds window matching filter', () => {
        expect(mainWindow).toBeDefined();
      });
      test('returned window has url method', () => {
        expect(typeof mainWindow.url).toBe('function');
      });
      test('returned window has title method', () => {
        expect(typeof mainWindow.title).toBe('function');
      });
      test('window URL contains expected content', () => {
        const url = mainWindow.url();
        expect(url).toMatch(/chrome-tabs|electronim/i);
      });
      test('window title resolves to string', async () => {
        const title = await mainWindow.title();
        expect(typeof title).toBe('string');
      });
      describe('with timeout', () => {
        test('throws error when window not found within timeout', async () => {
          await expect(
            electron.waitForWindow(({url}) => url.includes('nonexistent-window'), 500)
          ).rejects.toThrow('Window matching filter not found (timeout after 500ms)');
        });
      });
    });
    describe('isFullScreen', () => {
      test('method exists', () => {
        expect(typeof electron.isFullScreen).toBe('function');
      });
      test('returns a promise', async () => {
        const result = electron.isFullScreen();
        expect(result).toBeInstanceOf(Promise);
        await result.catch(() => {}); // Wait for promise to resolve to prevent app from closing before the test is complete
      });
    });
    describe('waitForCondition', () => {
      describe('when condition is true', () => {
        test('resolves immediately', async () => {
          const result = await electron.waitForCondition(() => true);
          expect(result).toBe(true);
        });
      });
      describe('when condition becomes true', () => {
        test('waits and resolves', async () => {
          let counter = 0;
          const result = await electron.waitForCondition(() => {
            counter++;
            return counter > 3;
          }, {interval: 50, timeout: 2000});
          expect(result).toBe(true);
          expect(counter).toBeGreaterThan(3);
        });
      });
      describe('when condition is never met', () => {
        test('throws timeout error', async () => {
          await expect(
            electron.waitForCondition(() => false, {timeout: 300})
          ).rejects.toThrow('Condition not met (timeout after 300ms)');
        });
      });

      describe('with custom message', () => {
        test('includes custom message in error', async () => {
          await expect(
            electron.waitForCondition(() => false, {timeout: 300, message: 'Custom condition failed'})
          ).rejects.toThrow('Custom condition failed (timeout after 300ms)');
        });
      });
    });
    describe('getActiveTabId', () => {
      test('returns a tab ID', async () => {
        const tabId = await electron.getActiveTabId(mainWindow);
        expect(typeof tabId).toBe('string');
      });
      test('tab ID is not empty', async () => {
        const tabId = await electron.getActiveTabId(mainWindow);
        expect(tabId.length).toBeGreaterThan(0);
      });
    });
    describe('isFindInPageOpen', () => {
      test('method exists', () => {
        expect(typeof electron.isFindInPageOpen).toBe('function');
      });

      test('returns a promise', async () => {
        const result = electron.isFindInPageOpen();
        expect(result).toBeInstanceOf(Promise);
        await result.catch(() => {}); // Wait for promise to resolve to prevent app from closing before the test is complete
      });
    });
    describe('sendKeys', () => {
      test('sends key without error', async () => {
        await expect(electron.sendKeys('a')).resolves.not.toThrow();
      });
      test('sends special key without error', async () => {
        await expect(electron.sendKeys('Escape')).resolves.not.toThrow();
      });
      test('sends key with modifier without error', async () => {
        await expect(electron.sendKeys('f', ['control'])).resolves.not.toThrow();
      });
      test('window still exists after sending keys', () => {
        expect(mainWindow).toBeDefined();
        expect(electron.app.windows().length).toBeGreaterThan(0);
      });
    });
  });
});
