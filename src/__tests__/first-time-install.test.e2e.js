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
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const STARTUP_TIMEOUT = 15000;

describe('E2E :: First-time install test suite', () => {
  let tempDir;
  let emptySettingsPath;

  beforeAll(async () => {
    // Create temporary directory and empty settings file to simulate first-time install
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'electronim-test-'));
    emptySettingsPath = path.join(tempDir, 'settings.json');
    fs.writeFileSync(emptySettingsPath, JSON.stringify({tabs: []}));
  });

  afterAll(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, {recursive: true});
    }
  });

  describe('on first launch with no configured services', () => {
    let electron;
    let settingsWindow;

    beforeAll(async () => {
      electron = await spawnElectron({extraArgs: ['--settings-path', emptySettingsPath]});
      // Wait for settings dialog to appear (it should appear automatically when no tabs are configured)
      settingsWindow = await electron.waitForWindow(({url}) => url.includes('settings/index.html'));
    }, STARTUP_TIMEOUT);

    afterAll(async () => {
      await electron.kill();
    }, STARTUP_TIMEOUT);

    test('starts the application', () => {
      expect(electron.app).toBeDefined();
    });

    describe('settings-dialog', () => {
      test('verifies settings dialog is displayed', async () => {
        const settings = settingsWindow.locator('.settings');
        await expect(settings).toBeVisible();
      });

      test('verifies settings dialog has services pane', async () => {
        const servicesPane = settingsWindow.locator('.settings__services');
        await expect(servicesPane).toBeVisible();
      });

      test('can execute JavaScript in the settings dialog', async () => {
        const title = await settingsWindow.evaluate(() => document.title);
        expect(title).toContain('Settings');
      });

      test('can add a new service by typing URL and clicking add button', async () => {
        // Get the input field for new service URL
        const input = settingsWindow.locator('.settings__new-tab input');
        await expect(input).toBeVisible();

        // Type the URL
        await input.fill('https://web.whatsapp.com');

        // Get the add button and verify it's enabled
        const addButton = settingsWindow.locator('.settings__new-tab .material3.icon-button');
        await expect(addButton).toBeEnabled();

        // Click the add button
        await addButton.click();

        // Verify the service was added to the list
        const tabs = settingsWindow.locator('.settings__tabs .settings__tab');
        await expect(tabs).toHaveCount(1);

        // Verify the first tab has the correct URL
        const firstTabInput = settingsWindow.locator('.settings__tabs .settings__tab .settings__tab-main input');
        await expect(firstTabInput).toHaveValue('https://web.whatsapp.com');

        // Verify the input field is cleared
        await expect(input).toHaveValue('');
      });
    });
  });
});
