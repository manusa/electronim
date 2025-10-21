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
            name: 'Test Service 1'
          },
          {
            id: 'test-service-2',
            url: testServer2.url,
            name: 'Test Service 2'
          },
          {
            id: 'test-service-3',
            url: testServer3.url,
            name: 'Test Service 3'
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
    let initialFullScreen;

    beforeAll(async () => {
      initialFullScreen = await electron.isFullScreen();
    });

    test('pressing F11 toggles fullscreen state', async () => {
      // When
      await electron.sendKeys('F11');
      await electron.waitForCondition(
        async () => (await electron.isFullScreen()) === !initialFullScreen,
        {message: 'Fullscreen state did not toggle'}
      );
      // Then
      expect(await electron.isFullScreen()).toBe(!initialFullScreen);
    }, TEST_TIMEOUT);

    test('pressing F11 again toggles back to initial state', async () => {
      // Given
      expect(await electron.isFullScreen()).toBe(!initialFullScreen);
      // When
      await electron.sendKeys('F11');
      await electron.waitForCondition(
        async () => (await electron.isFullScreen()) === initialFullScreen,
        {message: 'Fullscreen state did not toggle back'}
      );
      // Then
      expect(await electron.isFullScreen()).toBe(initialFullScreen);
    }, TEST_TIMEOUT);
  });

  describe('Ctrl+[1-9] tab switching', () => {
    beforeEach(async () => {
      await electron.sendKeys('1', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-1');
    });

    test('Ctrl+1 activates first tab', async () => {
      // Given
      await electron.sendKeys('2', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-2');
      // When
      await electron.sendKeys('1', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-1');
      // Then
      expect(await electron.getActiveTabId(mainWindow)).toBe('test-service-1');
    }, TEST_TIMEOUT);

    test('Ctrl+2 activates second tab', async () => {
      // When
      await electron.sendKeys('2', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-2');
      // Then
      expect(await electron.getActiveTabId(mainWindow)).toBe('test-service-2');
    }, TEST_TIMEOUT);

    test('Ctrl+3 activates third tab', async () => {
      // When
      await electron.sendKeys('3', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-3');
      // Then
      expect(await electron.getActiveTabId(mainWindow)).toBe('test-service-3');
    }, TEST_TIMEOUT);
  });

  describe('Ctrl+Tab tab traversal', () => {
    test('Ctrl+Tab cycles to next tab', async () => {
      // Given
      await electron.sendKeys('1', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-1');
      // When
      await electron.sendKeys('Tab', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-2');
      // Then
      expect(await electron.getActiveTabId(mainWindow)).toBe('test-service-2');
    }, TEST_TIMEOUT);

    test('Ctrl+Shift+Tab cycles to previous tab', async () => {
      // Given
      await electron.sendKeys('2', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-2');
      // When
      await electron.sendKeys('Tab', ['control', 'shift']);
      await electron.waitForActiveTab(mainWindow, 'test-service-1');
      // Then
      expect(await electron.getActiveTabId(mainWindow)).toBe('test-service-1');
    }, TEST_TIMEOUT);

    test('Ctrl+Tab wraps around from last to first tab', async () => {
      // Given
      // Start from last tab
      await electron.sendKeys('3', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-3');
      // When
      await electron.sendKeys('Tab', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-1');
      // Then
      expect(await electron.getActiveTabId(mainWindow)).toBe('test-service-1');
    }, TEST_TIMEOUT);
  });

  describe('Ctrl+f find in page', () => {
    test('pressing Ctrl+f opens find-in-page dialog', async () => {
      // Given
      await electron.sendKeys('1', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-1');
      expect(await electron.isFindInPageOpen()).toBe(false);
      // When
      await electron.sendKeys('f', ['control']);
      await electron.waitForCondition(
        async () => await electron.isFindInPageOpen(),
        {message: 'Find-in-page dialog did not open'}
      );
      // Then
      expect(await electron.isFindInPageOpen()).toBe(true);
    }, TEST_TIMEOUT);

    test('pressing Escape closes find-in-page dialog', async () => {
      // Given
      if (!(await electron.isFindInPageOpen())) {
        await electron.sendKeys('f', ['control']);
        await electron.waitForCondition(
          async () => await electron.isFindInPageOpen(),
          {message: 'Find-in-page dialog did not open'}
        );
      }
      expect(await electron.isFindInPageOpen()).toBe(true);
      // When
      await electron.sendKeys('Escape');
      await electron.waitForCondition(
        async () => !(await electron.isFindInPageOpen()),
        {message: 'Find-in-page dialog did not close'}
      );
      // Then
      expect(await electron.isFindInPageOpen()).toBe(false);
    }, TEST_TIMEOUT);
  });

  describe('Meta key shortcuts (macOS legacy support)', () => {
    beforeEach(async () => {
      await electron.sendKeys('3', ['control']);
      await electron.waitForActiveTab(mainWindow, 'test-service-3');
    });

    test('Meta+1 activates first tab', async () => {
      // When
      await electron.sendKeys('1', ['meta']);
      await electron.waitForActiveTab(mainWindow, 'test-service-1');
      // Then
      expect(await electron.getActiveTabId(mainWindow)).toBe('test-service-1');
    }, TEST_TIMEOUT);

    test('Meta+2 activates first tab', async () => {
      // When
      await electron.sendKeys('2', ['meta']);
      await electron.waitForActiveTab(mainWindow, 'test-service-2');
      // Then
      expect(await electron.getActiveTabId(mainWindow)).toBe('test-service-2');
    }, TEST_TIMEOUT);
  });
});
