/**
 * @jest-environment node
 */
/*
  Copyright 2026 Marc Nuri San Felix

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
const fs = require('node:fs');
const path = require('node:path');
const {spawnElectron, expect} = require('./');

describe('E2E :: Settings custom icon test suite', () => {
  // 1024x1024 PNG (~136 KB), larger than what is stored inline as is
  const largeImage = path.resolve(__dirname, '..', 'assets', 'icon_1024x1024.png');
  let electron;
  let settingsWindow;
  let customIcon;

  beforeAll(async () => {
    electron = await spawnElectron({settings: {tabs: []}});
    settingsWindow = await electron.waitForWindow(({url}) => url.includes('settings/index.html'));
    await settingsWindow.locator('.settings__new-tab input').fill('http://127.0.0.1:9');
    await settingsWindow.locator('.settings__new-tab .material3.icon-button').click();
    await settingsWindow.locator('.settings__tab .expand-button').click();
    await settingsWindow.locator('[data-testid="settings-services-custom-icon-file"]').setInputFiles(largeImage);
    await expect(settingsWindow.locator('.settings__custom-icon-preview')).toBeVisible();
    await settingsWindow.locator('.settings__submit').click();
    const settingsPath = path.join(electron.tempDir, 'settings.json');
    await expect.poll(() => JSON.parse(fs.readFileSync(settingsPath, 'utf8')).tabs?.[0]?.customIcon)
      .toBeDefined();
    customIcon = JSON.parse(fs.readFileSync(settingsPath, 'utf8')).tabs[0].customIcon;
  });

  afterAll(async () => {
    await electron.kill();
  });

  test('stores a large local image as a WebP data URL', () => {
    expect(customIcon).toMatch(/^data:image\/webp;base64,/);
  });

  test('stores a large local image smaller than the inline limit (32 KB)', () => {
    // When
    const bytes = Buffer.from(customIcon.split(',')[1], 'base64').length;
    // Then
    expect(bytes).toBeLessThan(32 * 1024);
  });

  test('downscales a large local image to 128x128', async () => {
    // Given
    const tabsWindow = await electron.waitForWindow(({url}) => url.includes('chrome-tabs/index.html'));
    // When
    const size = await tabsWindow.evaluate(src => new Promise(resolve => {
      const image = new Image();
      image.onload = () => resolve(`${image.naturalWidth}x${image.naturalHeight}`);
      image.src = src;
    }), customIcon);
    // Then
    expect(size).toBe('128x128');
  });
});
