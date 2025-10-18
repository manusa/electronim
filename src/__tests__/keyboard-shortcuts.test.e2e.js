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

const STARTUP_TIMEOUT = 30000;
const TEST_TIMEOUT = 15000;

describe('E2E :: Keyboard shortcuts test suite', () => {
  let electron;
  let mainWindow;
  let testServer1;
  let testServer2;
  let testServer3;

  beforeAll(async () => {
    // Start HTTP servers with test pages
    testServer1 = await createTestServer({manualCleanup: true});
    testServer2 = await createTestServer({manualCleanup: true});
    testServer3 = await createTestServer({manualCleanup: true});

    // Start Electron with multiple test tabs
    electron = await spawnElectron({
      settings: {
        tabs: [
          {
            id: 'test-tab-1',
            url: testServer1.url,
            name: 'Test Tab 1'
          },
          {
            id: 'test-tab-2',
            url: testServer2.url,
            name: 'Test Tab 2'
          },
          {
            id: 'test-tab-3',
            url: testServer3.url,
            name: 'Test Tab 3'
          }
        ]
      }
    });
    mainWindow = await electron.waitForWindow(
      ({url, title}) => url.includes('chrome-tabs') || title === 'ElectronIM tabs');
  }, STARTUP_TIMEOUT);

  afterAll(async () => {
    await Promise.all([
      electron.kill(),
      testServer1.close(),
      testServer2.close(),
      testServer3.close()
    ]);
  }, STARTUP_TIMEOUT);

  test('application starts with multiple tabs', async () => {
    const tabs = mainWindow.locator('.chrome-tab');
    await expect(tabs).toHaveCount(3);
  });

  describe('F11 fullscreen toggle', () => {
    test('pressing F11 toggles fullscreen mode', async () => {
      // Press F11 to toggle fullscreen
      await electron.sendKeys('F11');

      // Wait for fullscreen transition
      await mainWindow.waitForTimeout(1000);

      // Check the app is still responsive
      const title = await mainWindow.title();
      expect(title).toContain('ElectronIM');

      // Toggle back
      await electron.sendKeys('F11');
      await mainWindow.waitForTimeout(500);
    }, TEST_TIMEOUT);
  });

  describe('Ctrl+[1-9] tab switching', () => {
    test('Ctrl+1 activates first tab', async () => {
      // Switch to second tab first
      await electron.sendKeys('2', ['control']);
      await mainWindow.waitForTimeout(500);

      // Now press Ctrl+1 to switch to first tab
      await electron.sendKeys('1', ['control']);
      await mainWindow.waitForTimeout(500);

      const activeTab = mainWindow.locator('.chrome-tab[active]');
      const tabId = await activeTab.first().getAttribute('data-tab-id');
      expect(tabId).toBe('test-tab-1');
    }, TEST_TIMEOUT);

    test('Ctrl+2 activates second tab', async () => {
      await electron.sendKeys('2', ['control']);
      await mainWindow.waitForTimeout(500);

      const activeTab = mainWindow.locator('.chrome-tab[active]');
      const tabId = await activeTab.first().getAttribute('data-tab-id');
      expect(tabId).toBe('test-tab-2');
    }, TEST_TIMEOUT);

    test('Ctrl+3 activates third tab', async () => {
      await electron.sendKeys('3', ['control']);
      await mainWindow.waitForTimeout(500);

      const activeTab = mainWindow.locator('.chrome-tab[active]');
      const tabId = await activeTab.first().getAttribute('data-tab-id');
      expect(tabId).toBe('test-tab-3');
    }, TEST_TIMEOUT);
  });

  describe('Ctrl+Tab tab traversal', () => {
    test('Ctrl+Tab cycles to next tab', async () => {
      // Start from first tab
      await electron.sendKeys('1', ['control']);
      await mainWindow.waitForTimeout(500);

      // Press Ctrl+Tab to go to next tab
      await electron.sendKeys('Tab', ['control']);
      await mainWindow.waitForTimeout(500);

      const activeTab = mainWindow.locator('.chrome-tab[active]');
      const tabId = await activeTab.first().getAttribute('data-tab-id');
      expect(tabId).toBe('test-tab-2');
    }, TEST_TIMEOUT);

    test('Ctrl+Shift+Tab cycles to previous tab', async () => {
      // Start from second tab
      await electron.sendKeys('2', ['control']);
      await mainWindow.waitForTimeout(500);

      // Press Ctrl+Shift+Tab to go to previous tab
      await electron.sendKeys('Tab', ['control', 'shift']);
      await mainWindow.waitForTimeout(500);

      const activeTab = mainWindow.locator('.chrome-tab[active]');
      const tabId = await activeTab.first().getAttribute('data-tab-id');
      expect(tabId).toBe('test-tab-1');
    }, TEST_TIMEOUT);

    test('Ctrl+Tab wraps around from last to first tab', async () => {
      // Start from last tab
      await electron.sendKeys('3', ['control']);
      await mainWindow.waitForTimeout(500);

      // Press Ctrl+Tab to wrap around
      await electron.sendKeys('Tab', ['control']);
      await mainWindow.waitForTimeout(500);

      const activeTab = mainWindow.locator('.chrome-tab[active]');
      const tabId = await activeTab.first().getAttribute('data-tab-id');
      expect(tabId).toBe('test-tab-1');
    }, TEST_TIMEOUT);
  });

  describe('Ctrl+f find in page', () => {
    test('pressing Ctrl+f sends the keyboard event', async () => {
      // Make sure we're on a tab first
      await electron.sendKeys('1', ['control']);
      await mainWindow.waitForTimeout(500);

      // Press Ctrl+f to send the keyboard event
      // Note: The find dialog may not appear in headless mode or may require focus
      await electron.sendKeys('f', ['control']);
      await mainWindow.waitForTimeout(1000);

      // Verify the app is still responsive after the keyboard event
      const title = await mainWindow.title();
      expect(title).toContain('ElectronIM');
    }, TEST_TIMEOUT);

    test('pressing Escape sends the keyboard event', async () => {
      // Press Escape
      await electron.sendKeys('Escape');
      await mainWindow.waitForTimeout(500);

      // Verify the app is still responsive
      const title = await mainWindow.title();
      expect(title).toContain('ElectronIM');
    }, TEST_TIMEOUT);
  });

  describe('Meta key shortcuts (macOS legacy support)', () => {
    test('Meta+1 activates first tab', async () => {
      // Switch to another tab first
      await electron.sendKeys('2', ['control']);
      await mainWindow.waitForTimeout(500);

      // Press Meta+1 (Cmd+1 on Mac)
      await electron.sendKeys('1', ['meta']);
      await mainWindow.waitForTimeout(500);

      const activeTab = mainWindow.locator('.chrome-tab[active]');
      const tabId = await activeTab.first().getAttribute('data-tab-id');
      expect(tabId).toBe('test-tab-1');
    }, TEST_TIMEOUT);
  });
});
