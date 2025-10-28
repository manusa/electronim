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

const STARTUP_TIMEOUT = 15000;

describe('E2E :: About dialog test suite', () => {
  describe('opening and displaying about information', () => {
    let electron;
    let mainWindow;
    let testServer;

    beforeAll(async () => {
      // Start HTTP server with test page
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

    describe('opening about dialog from app menu', () => {
      let appMenuWindow;
      let aboutWindow;

      test('opens app menu when clicking menu button', async () => {
        const menuButton = mainWindow.locator('.menu__button');
        await expect(menuButton).toBeVisible();
        await menuButton.click();

        // Wait for app menu window to appear
        appMenuWindow = await electron.waitForWindow(
          ({url}) => url.includes('app-menu/index.html')
        );
        expect(appMenuWindow).toBeDefined();
      });

      test('app menu displays about menu entry', async () => {
        const aboutMenuItem = appMenuWindow.locator('[data-testid="about-menu-entry"]');
        await expect(aboutMenuItem).toBeVisible();
        await expect(aboutMenuItem).toContainText('About');
      });

      test('clicking about menu entry opens about dialog', async () => {
        const aboutMenuItem = appMenuWindow.locator('[data-testid="about-menu-entry"]');
        await aboutMenuItem.click();

        // Wait for about dialog window to appear
        aboutWindow = await electron.waitForWindow(
          ({url}) => url.includes('about/index.html')
        );
        expect(aboutWindow).toBeDefined();
      });

      test('about dialog has correct title', async () => {
        const title = await aboutWindow.title();
        expect(title).toContain('About');
      });

      describe('about dialog content', () => {
        test('displays ElectronIM headline with version', async () => {
          const headline = aboutWindow.locator('.card__headline');
          await expect(headline).toBeVisible();
          const headlineText = await headline.textContent();
          expect(headlineText).toMatch(/ElectronIM \d+\.\d+\.\d+/);
        });

        test('displays ElectronIM logo', async () => {
          const logo = aboutWindow.locator('.card__image svg.electronim-logo');
          await expect(logo).toBeVisible();
        });

        test('displays component version for Electron', async () => {
          const electronVersion = aboutWindow.locator('.about-content__version:has(.version__component:text("Electron"))');
          await expect(electronVersion).toBeVisible();
          const versionValue = electronVersion.locator('.version__value');
          const versionText = await versionValue.textContent();
          expect(versionText.length).toBeGreaterThan(0);
        });

        test('displays component version for Chromium', async () => {
          const chromiumVersion = aboutWindow.locator('.about-content__version:has(.version__component:text("Chromium"))');
          await expect(chromiumVersion).toBeVisible();
          const versionValue = chromiumVersion.locator('.version__value');
          const versionText = await versionValue.textContent();
          expect(versionText.length).toBeGreaterThan(0);
        });

        test('displays component version for Node', async () => {
          const nodeVersion = aboutWindow.locator('.about-content__version:has(.version__component:text("Node"))');
          await expect(nodeVersion).toBeVisible();
          const versionValue = nodeVersion.locator('.version__value');
          const versionText = await versionValue.textContent();
          expect(versionText.length).toBeGreaterThan(0);
        });

        test('displays component version for V8', async () => {
          const v8Version = aboutWindow.locator('.about-content__version:has(.version__component:text("V8"))');
          await expect(v8Version).toBeVisible();
          const versionValue = v8Version.locator('.version__value');
          const versionText = await versionValue.textContent();
          expect(versionText.length).toBeGreaterThan(0);
        });

        test('displays release notes link', async () => {
          const releaseLink = aboutWindow.locator('a:has-text("Release Notes")');
          await expect(releaseLink).toBeVisible();
          const href = await releaseLink.getAttribute('href');
          expect(href).toContain('github.com/manusa/electronim/releases/tag/v');
        });

        test('displays license link', async () => {
          const licenseLink = aboutWindow.locator('a:has-text("Apache License, Version 2.0")');
          await expect(licenseLink).toBeVisible();
          const href = await licenseLink.getAttribute('href');
          expect(href).toContain('github.com/manusa/electronim/blob/main/LICENSE');
        });

        test('displays GitHub star link', async () => {
          const githubLink = aboutWindow.locator('a:has-text("GitHub star")');
          await expect(githubLink).toBeVisible();
          const href = await githubLink.getAttribute('href');
          expect(href).toContain('github.com/manusa/electronim');
        });
      });

      describe('closing about dialog', () => {
        test('about dialog has close button in top app bar', async () => {
          const closeButton = aboutWindow.locator('.top-app-bar .leading-navigation-icon');
          await expect(closeButton).toBeVisible();
        });

        test('clicking close button closes about dialog', async () => {
          const closeButton = aboutWindow.locator('.top-app-bar .leading-navigation-icon');
          await closeButton.click();

          // Wait a moment for the dialog to close
          await new Promise(resolve => setTimeout(resolve, 500));

          // Verify about dialog is no longer in the windows list
          const aboutStillExists = electron.app.windows().some(
            window => window.url().includes('about/index.html')
          );
          expect(aboutStillExists).toBe(false);
        });
      });
    });
  });
});
