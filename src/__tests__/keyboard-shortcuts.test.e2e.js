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
            id: 'test-service-1',
            url: testServer1.url,
            name: 'Test Tab 1'
          },
          {
            id: 'test-service-2',
            url: testServer2.url,
            name: 'Test Tab 2'
          },
          {
            id: 'test-service-3',
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
      // Get initial fullscreen state
      const initialFullScreen = await electron.isFullScreen();

      // Press F11 to toggle fullscreen
      await electron.sendKeys('F11');

      // Wait for fullscreen state to change
      await electron.waitForCondition(
        async () => (await electron.isFullScreen()) === !initialFullScreen,
        {message: 'Fullscreen state did not toggle'}
      );

      // Verify fullscreen state changed
      expect(await electron.isFullScreen()).toBe(!initialFullScreen);

      // Toggle back
      await electron.sendKeys('F11');

      // Wait for fullscreen state to return to initial
      await electron.waitForCondition(
        async () => (await electron.isFullScreen()) === initialFullScreen,
        {message: 'Fullscreen state did not toggle back'}
      );

      // Verify we're back to initial state
      expect(await electron.isFullScreen()).toBe(initialFullScreen);
    }, TEST_TIMEOUT);
  });

  describe('Ctrl+[1-9] tab switching', () => {
    beforeEach(async () => {
      // Start from first tab for consistency
      await electron.sendKeys('1', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-1');
    });

    test('Ctrl+1 activates first tab', async () => {
      // Switch to second tab first
      await electron.sendKeys('2', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-2');

      // Now press Ctrl+1 to switch to first tab
      await electron.sendKeys('1', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-1');

      expect(await electron.getActiveTabId(mainWindow)).toBe('test-service-1');
    }, TEST_TIMEOUT);

    test('Ctrl+2 activates second tab', async () => {
      await electron.sendKeys('2', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-2');

      expect(await electron.getActiveTabId(mainWindow)).toBe('test-service-2');
    }, TEST_TIMEOUT);

    test('Ctrl+3 activates third tab', async () => {
      await electron.sendKeys('3', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-3');

      expect(await electron.getActiveTabId(mainWindow)).toBe('test-service-3');
    }, TEST_TIMEOUT);
  });

  describe('Ctrl+Tab tab traversal', () => {
    test('Ctrl+Tab cycles to next tab', async () => {
      // Start from first tab
      await electron.sendKeys('1', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-1');

      // Press Ctrl+Tab to go to next tab
      await electron.sendKeys('Tab', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-2');

      expect(await electron.getActiveTabId(mainWindow)).toBe('test-service-2');
    }, TEST_TIMEOUT);

    test('Ctrl+Shift+Tab cycles to previous tab', async () => {
      // Start from second tab
      await electron.sendKeys('2', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-2');

      // Press Ctrl+Shift+Tab to go to previous tab
      await electron.sendKeys('Tab', ['control', 'shift']);
      await electron.waitForActiveTab(mainWindow, 'test-service-1');

      expect(await electron.getActiveTabId(mainWindow)).toBe('test-service-1');
    }, TEST_TIMEOUT);

    test('Ctrl+Tab wraps around from last to first tab', async () => {
      // Start from last tab
      await electron.sendKeys('3', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-3');

      // Press Ctrl+Tab to wrap around
      await electron.sendKeys('Tab', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-1');

      expect(await electron.getActiveTabId(mainWindow)).toBe('test-service-1');
    }, TEST_TIMEOUT);
  });

  describe('Ctrl+f find in page', () => {
    test('pressing Ctrl+f opens find-in-page dialog', async () => {
      // Make sure we're on a tab first
      await electron.sendKeys('1', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-1');

      // Verify find-in-page is not open initially
      expect(await electron.isFindInPageOpen()).toBe(false);

      // Press Ctrl+f to open find dialog
      await electron.sendKeys('f', ['control']);

      // Wait for find-in-page dialog to open
      await electron.waitForCondition(
        async () => await electron.isFindInPageOpen(),
        {message: 'Find-in-page dialog did not open'}
      );

      // Verify find-in-page dialog is now open
      expect(await electron.isFindInPageOpen()).toBe(true);
    }, TEST_TIMEOUT);

    test('pressing Escape closes find-in-page dialog', async () => {
      // Ensure find-in-page is open (from previous test or open it)
      if (!(await electron.isFindInPageOpen())) {
        await electron.sendKeys('f', ['control']);
        await electron.waitForCondition(
          async () => await electron.isFindInPageOpen(),
          {message: 'Find-in-page dialog did not open'}
        );
      }

      // Verify find-in-page is open
      expect(await electron.isFindInPageOpen()).toBe(true);

      // Press Escape to close
      await electron.sendKeys('Escape');

      // Wait for find-in-page dialog to close
      await electron.waitForCondition(
        async () => !(await electron.isFindInPageOpen()),
        {message: 'Find-in-page dialog did not close'}
      );

      // Verify find-in-page is now closed
      expect(await electron.isFindInPageOpen()).toBe(false);
    }, TEST_TIMEOUT);
  });

  describe('Meta key shortcuts (macOS legacy support)', () => {
    beforeEach(async () => {
      // Start from first tab for consistency
      await electron.sendKeys('1', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-1');
    });

    test('Meta+1 activates first tab', async () => {
      // Switch to another tab first
      await electron.sendKeys('2', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-2');

      // Press Meta+1 (Cmd+1 on Mac)
      await electron.sendKeys('1', ['meta']);
      await electron.waitForActiveTab(mainWindow, 'test-service-1');

      expect(await electron.getActiveTabId(mainWindow)).toBe('test-service-1');
    }, TEST_TIMEOUT);
  });
});
