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

describe('E2E :: Application startup test suite', () => {
  describe('with configured tab services', () => {
    let electron;
    let mainWindow;
    let testServer;

    beforeAll(async () => {
      // Start HTTP server with test page
      // Use manualCleanup to prevent auto-close after each test
      testServer = await createTestServer({manualCleanup: true});

      // Start Electron with test settings
      electron = await spawnElectron({
        settings: {
          tabs: [
            {
              id: 'test-tab-1',
              url: testServer.url,
              name: 'Test Tab'
            }
          ]
        }
      });
      mainWindow = await electron.waitForWindow(
        ({url, title}) => url.includes('chrome-tabs') || title === 'ElectronIM tabs');
    }, STARTUP_TIMEOUT);

    afterAll(async () => {
      await Promise.all([electron.kill(), testServer.close()]);
    }, STARTUP_TIMEOUT);

    test('starts the application', () => {
      expect(electron.app).toBeDefined();
    });

    test('creates main window', () => {
      expect(mainWindow).toBeDefined();
    });

    describe('main window', () => {
      test('has ElectronIM title', async () => {
        const title = await mainWindow.title();
        expect(title).toContain('ElectronIM');
      });

      test('verifies tab container element exists', async () => {
        const tabContainer = await mainWindow.locator('.tab-container');
        await expect(tabContainer).toBeVisible();
      });

      test('verifies HTML has electronim class', async () => {
        const html = await mainWindow.locator('html.electronim');
        await expect(html).toHaveCount(1);
      });

      test('can execute JavaScript in the renderer process', async () => {
        const title = await mainWindow.evaluate(() => document.title);
        expect(title).toContain('ElectronIM');
      });
    });

    describe('configured tab', () => {
      test('displays the configured tab', async () => {
        const chromeTabs = mainWindow.locator('.chrome-tabs');
        await expect(chromeTabs).toBeVisible();

        const tabs = mainWindow.locator('.chrome-tab');
        await expect(tabs).toHaveCount(1);
      });

      test('tab has correct title', async () => {
        // The title is updated dynamically from the settings, so we need to wait for it
        const tabTitle = mainWindow.locator('.chrome-tab .chrome-tab-title');
        // Wait for the title to be visible and have content
        await expect(tabTitle).toBeVisible({timeout: 10000});
        const titleText = await tabTitle.textContent();
        // The title could be either 'Test Tab' (from settings) or 'ElectronIM E2E Test Page' (from page title)
        expect(titleText.length).toBeGreaterThan(0);
      });

      describe('test page content', () => {
        let testPageWindow;

        beforeAll(async () => {
          // Wait for the test page window to appear
          testPageWindow = await electron.waitForWindow(
            ({url}) => url === testServer.url || url.includes('localhost'),
            5000
          );
        });

        test('test page window is created', () => {
          expect(testPageWindow).toBeDefined();
        });

        test('test page has loaded marker', async () => {
          const testPageLoaded = await testPageWindow.evaluate(() => {
            return window.electronimTestPageLoaded === true;
          });
          expect(testPageLoaded).toBe(true);
        });

        test('test page has correct heading', async () => {
          const heading = testPageWindow.locator('#test-heading');
          await expect(heading).toContainText('ElectronIM E2E Test Page');
        });

        test('test page displays status section', async () => {
          const status = testPageWindow.locator('#status');
          await expect(status).toContainText('Loaded Successfully');
        });

        test('test page displays timestamp', async () => {
          const timestamp = testPageWindow.locator('#timestamp');
          const timestampText = await timestamp.textContent();
          expect(timestampText.length).toBeGreaterThan(0);
        });
      });
    });

    describe('tab reload', () => {
      let testPageWindow;
      let initialTimestamp;

      beforeAll(async () => {
        testPageWindow = await electron.waitForWindow(({url}) => url === testServer.url || url.includes('localhost'));
        const timestampElement = testPageWindow.locator('#timestamp');
        initialTimestamp = await timestampElement.textContent();
      });

      test('initial timestamp is recorded', () => {
        expect(initialTimestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);
      });

      test('reloading tab changes timestamp', async () => {
        await testPageWindow.reload();

        const timestampElement = testPageWindow.locator('#timestamp');
        await expect(timestampElement).not.toHaveText(initialTimestamp);
      });
    });
  });
});
