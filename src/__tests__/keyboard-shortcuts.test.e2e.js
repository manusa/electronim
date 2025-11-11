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

describe('E2E :: Keyboard shortcuts test suite', () => {
  let electron;
  let chromeTabsView;
  let testServer;
  let testView;

  beforeAll(async () => {
    testServer = await createTestServer({manualCleanup: true});

    electron = await spawnElectron({
      settings: {
        tabs: [
          {
            id: 'test-service-1',
            url: testServer.url,
            customName: 'Test Service 1'
          },
          {
            id: 'test-service-2',
            url: testServer.url,
            customName: 'Test Service 2'
          },
          {
            id: 'test-service-3',
            url: testServer.url,
            customName: 'Test Service 3'
          }
        ]
      }
    });
    chromeTabsView = await electron.waitForWindow(
      ({url, title}) => url.includes('chrome-tabs') || title === 'ElectronIM tabs');
    testView = await electron.waitForWindow(({title}) => title === 'ElectronIM Test Page');
  });

  afterAll(async () => {
    await Promise.all([
      electron.kill(),
      testServer.close()
    ]);
  });

  test('application starts with multiple tabs', async () => {
    const tabs = chromeTabsView.locator('.chrome-tab');
    await expect(tabs).toHaveCount(3);
  });

  describe('F11 fullscreen toggle', () => {
    let initialFullScreen;

    beforeAll(async () => {
      initialFullScreen = await electron.isFullScreen();
    });

    test('pressing F11 toggles fullscreen state', async () => {
      // When
      await electron.sendKeys({window: chromeTabsView, key: 'F11'});
      await electron.waitForCondition(
        async () => (await electron.isFullScreen()) === !initialFullScreen,
        {message: 'Fullscreen state did not toggle'}
      );
      // Then
      expect(await electron.isFullScreen()).toBe(!initialFullScreen);
    });

    test('pressing F11 again toggles back to initial state', async () => {
      // Given
      expect(await electron.isFullScreen()).toBe(!initialFullScreen);
      // When
      await electron.sendKeys({window: chromeTabsView, key: 'F11'});
      await electron.waitForCondition(
        async () => (await electron.isFullScreen()) === initialFullScreen,
        {message: 'Fullscreen state did not toggle back'}
      );
      // Then
      expect(await electron.isFullScreen()).toBe(initialFullScreen);
    });
  });

  describe('Ctrl+[1-9] tab switching', () => {
    test('Ctrl+1 activates first tab', async () => {
      // Given
      await electron.sendKeys({window: chromeTabsView, key: '2', modifiers: ['control']});
      await electron.waitForActiveTab(chromeTabsView, 'test-service-2');
      // When
      await electron.sendKeys({window: chromeTabsView, key: '1', modifiers: ['control']});
      await electron.waitForActiveTab(chromeTabsView, 'test-service-1');
      // Then
      expect(await electron.getActiveTabId(chromeTabsView)).toBe('test-service-1');
    });

    test('Ctrl+2 activates second tab', async () => {
      // When
      await electron.sendKeys({window: chromeTabsView, key: '2', modifiers: ['control']});
      await electron.waitForActiveTab(chromeTabsView, 'test-service-2');
      // Then
      expect(await electron.getActiveTabId(chromeTabsView)).toBe('test-service-2');
    });

    test('Ctrl+3 activates third tab', async () => {
      // When
      await electron.sendKeys({window: chromeTabsView, key: '3', modifiers: ['control']});
      await electron.waitForActiveTab(chromeTabsView, 'test-service-3');
      // Then
      expect(await electron.getActiveTabId(chromeTabsView)).toBe('test-service-3');
    });
  });

  describe('Ctrl+Tab tab traversal', () => {
    test('Ctrl+Tab cycles to next tab', async () => {
      // Given
      await electron.sendKeys({window: chromeTabsView, key: '1', modifiers: ['control']});
      await electron.waitForActiveTab(chromeTabsView, 'test-service-1');
      // When
      await electron.sendKeys({window: chromeTabsView, key: 'Tab', modifiers: ['control']});
      await electron.waitForActiveTab(chromeTabsView, 'test-service-2');
      // Then
      expect(await electron.getActiveTabId(chromeTabsView)).toBe('test-service-2');
    });

    test('Ctrl+Shift+Tab cycles to previous tab', async () => {
      // Given
      await electron.sendKeys({window: chromeTabsView, key: '2', modifiers: ['control']});
      await electron.waitForActiveTab(chromeTabsView, 'test-service-2');
      // When
      await electron.sendKeys({window: chromeTabsView, key: 'Tab', modifiers: ['control', 'shift']});
      await electron.waitForActiveTab(chromeTabsView, 'test-service-1');
      // Then
      expect(await electron.getActiveTabId(chromeTabsView)).toBe('test-service-1');
    });

    test('Ctrl+Tab wraps around from last to first tab', async () => {
      // Given
      // Start from last tab
      await electron.sendKeys({window: chromeTabsView, key: '3', modifiers: ['control']});
      await electron.waitForActiveTab(chromeTabsView, 'test-service-3');
      // When
      await electron.sendKeys({window: chromeTabsView, key: 'Tab', modifiers: ['control']});
      await electron.waitForActiveTab(chromeTabsView, 'test-service-1');
      // Then
      expect(await electron.getActiveTabId(chromeTabsView)).toBe('test-service-1');
    });
  });

  describe('Ctrl+f find in page', () => {
    test('pressing Ctrl+f opens find-in-page dialog', async () => {
      // Given
      await electron.sendKeys({window: chromeTabsView, key: '1', modifiers: ['control']});
      await electron.waitForActiveTab(chromeTabsView, 'test-service-1');
      expect(await electron.isFindInPageOpen()).toBe(false);
      // When
      await electron.sendKeys({window: chromeTabsView, key: 'f', modifiers: ['control']});
      await electron.waitForCondition(
        async () => await electron.isFindInPageOpen(),
        {message: 'Find-in-page dialog did not open'}
      );
      // Then
      expect(await electron.isFindInPageOpen()).toBe(true);
    });

    test('pressing Escape closes find-in-page dialog', async () => {
      // Given
      if (!(await electron.isFindInPageOpen())) {
        await electron.sendKeys({window: chromeTabsView, key: 'f', modifiers: ['control']});
        await electron.waitForCondition(
          async () => await electron.isFindInPageOpen(),
          {message: 'Find-in-page dialog did not open'}
        );
      }
      expect(await electron.isFindInPageOpen()).toBe(true);
      // When
      await electron.sendKeys({window: chromeTabsView, key: 'Escape'});
      await electron.waitForCondition(
        async () => !(await electron.isFindInPageOpen()),
        {message: 'Find-in-page dialog did not close'}
      );
      // Then
      expect(await electron.isFindInPageOpen()).toBe(false);
    });
  });

  describe('Meta key shortcuts (macOS legacy support)', () => {
    test('Meta+1 activates first tab', async () => {
      // When
      await electron.sendKeys({window: chromeTabsView, key: '1', modifiers: ['meta']});
      await electron.waitForActiveTab(chromeTabsView, 'test-service-1');
      // Then
      expect(await electron.getActiveTabId(chromeTabsView)).toBe('test-service-1');
    });

    test('Meta+2 activates first tab', async () => {
      // When
      await electron.sendKeys({window: chromeTabsView, key: '2', modifiers: ['meta']});
      await electron.waitForActiveTab(chromeTabsView, 'test-service-2');
      // Then
      expect(await electron.getActiveTabId(chromeTabsView)).toBe('test-service-2');
    });
  });

  describe('Reload shortcuts', () => {
    let waitForTimestampChange;
    let initialTimestamp;

    beforeEach(async () => {
      initialTimestamp = await testView.locator('#timestamp').textContent();
      waitForTimestampChange = async () => {
        await electron.waitForCondition(
          async () => initialTimestamp !== await testView.locator('#timestamp').textContent(),
          {timeout: 5000, interval: 5, message: 'Timestamp did not change after reload'}
        );
      };
    });

    test('pressing F5 reloads the service', async () => {
      // When
      await electron.sendKeys({window: testView, key: 'F5'});
      await waitForTimestampChange();
      // Then
      const timestampAfter = await testView.locator('#timestamp').textContent();
      expect(timestampAfter).not.toBe(initialTimestamp);
    });

    test('pressing Ctrl+r reloads the service', async () => {
      // When
      await electron.sendKeys({window: testView, key: 'r', modifiers: ['control']});
      await waitForTimestampChange();
      // Then
      const timestampAfter = await testView.locator('#timestamp').textContent();
      expect(timestampAfter).not.toBe(initialTimestamp);
    });

    test('pressing Ctrl+R (uppercase) reloads the service', async () => {
      // When
      await electron.sendKeys({window: testView, key: 'R', modifiers: ['control']});
      await waitForTimestampChange();
      // Then
      const timestampAfter = await testView.locator('#timestamp').textContent();
      expect(timestampAfter).not.toBe(initialTimestamp);
    });

    test('pressing Meta+r reloads the service (macOS)', async () => {
      // When
      await electron.sendKeys({window: testView, key: 'r', modifiers: ['meta']});
      await waitForTimestampChange();
      // Then
      const timestampAfter = await testView.locator('#timestamp').textContent();
      expect(timestampAfter).not.toBe(initialTimestamp);
    });

    test('pressing Meta+R (uppercase) reloads the service (macOS)', async () => {
      // When
      await electron.sendKeys({window: testView, key: 'R', modifiers: ['meta']});
      await waitForTimestampChange();
      // Then
      const timestampAfter = await testView.locator('#timestamp').textContent();
      expect(timestampAfter).not.toBe(initialTimestamp);
    });
  });

  describe('Zoom shortcuts', () => {
    let waitForZoomChange;

    beforeEach(async () => {
      waitForZoomChange = async zoomCondition => {
        await electron.waitForCondition(
          async () => zoomCondition(await electron.getZoom(testView)),
          {timeout: 3000, interval: 5, message: 'Zoom did not change'});
      };
      // Reset zoom to 1.0 before each test
      await electron.sendKeys({window: testView, key: '0', modifiers: ['control']});
      await waitForZoomChange(zoom => zoom === 1.0);
    });

    test('pressing Ctrl+0 resets zoom to 100%', async () => {
      // Given - zoom in first
      await electron.sendKeys({window: testView, key: '+', modifiers: ['control']});
      await waitForZoomChange(zoom => zoom > 1.0);

      // When
      await electron.sendKeys({window: testView, key: '0', modifiers: ['control']});
      await waitForZoomChange(zoom => zoom === 1.0);

      // Then
      const finalZoom = await electron.getZoom(testView);
      expect(finalZoom).toBe(1.0);
    });

    test('pressing Ctrl++ increases zoom level', async () => {
      // When
      await electron.sendKeys({window: testView, key: '+', modifiers: ['control']});
      await waitForZoomChange(zoom => zoom > 1.0);

      // Then
      const finalZoom = await electron.getZoom(testView);
      expect(finalZoom).toBeCloseTo(1.1, 1);
    });

    test('pressing Ctrl+- decreases zoom level', async () => {
      // When
      await electron.sendKeys({window: testView, key: '-', modifiers: ['control']});
      await waitForZoomChange(zoom => zoom < 1.0);

      // Then
      const finalZoom = await electron.getZoom(testView);
      expect(finalZoom).toBeCloseTo(0.9, 1);
    });

    test('multiple Ctrl++ increases zoom progressively', async () => {
      // When
      await electron.sendKeys({window: testView, key: '+', modifiers: ['control']});
      await electron.sendKeys({window: testView, key: '+', modifiers: ['control']});
      await electron.sendKeys({window: testView, key: '+', modifiers: ['control']});
      await waitForZoomChange(zoom => zoom > 1.2);

      // Then
      const finalZoom = await electron.getZoom(testView);
      expect(finalZoom).toBeCloseTo(1.3, 1);
    });

    test('multiple Ctrl+- decreases zoom progressively', async () => {
      // When
      await electron.sendKeys({window: testView, key: '-', modifiers: ['control']});
      await electron.sendKeys({window: testView, key: '-', modifiers: ['control']});
      await electron.sendKeys({window: testView, key: '-', modifiers: ['control']});
      await waitForZoomChange(zoom => zoom < 0.8);

      // Then
      const finalZoom = await electron.getZoom(testView);
      expect(finalZoom).toBeCloseTo(0.7, 1);
    });

    test('zoom does not go below minimum threshold', async () => {
      // When - zoom out many times to try to reach minimum
      for (let i = 0; i < 15; i++) {
        await electron.sendKeys({window: testView, key: '-', modifiers: ['control']});
      }
      await waitForZoomChange(zoom => zoom < 0.3);

      // Then - should not go below 0.1
      const finalZoom = await electron.getZoom(testView);
      expect(finalZoom).toBeGreaterThanOrEqual(0.1);
    });
  });
});
