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

const {spawnElectron} = require('./');

const STARTUP_TIMEOUT = 30000;

describe('E2E :: Application startup test suite', () => {
  describe('with valid environment', () => {
    let electron;
    let mainWindow;

    beforeAll(async () => {
      electron = await spawnElectron();
      mainWindow = await electron.waitForWindow(
        ({url, title}) => url.includes('chrome-tabs') || title === 'ElectronIM tabs');
    }, STARTUP_TIMEOUT);

    afterAll(async () => {
      await electron.kill();
    }, STARTUP_TIMEOUT);

    test('starts the application', () => {
      expect(electron.app).toBeDefined();
    });

    test('creates main window', () => {
      expect(mainWindow).toBeDefined();
    });

    describe('tab-container', () => {
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
  });
});
