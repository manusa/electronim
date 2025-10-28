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

describe('E2E :: Help dialog test suite', () => {
  describe('opening and displaying help information', () => {
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

    describe('opening help dialog from app menu', () => {
      let appMenuWindow;
      let helpWindow;

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

      test('app menu displays help menu entry', async () => {
        const helpMenuItem = appMenuWindow.locator('[data-testid="help-menu-entry"]');
        await expect(helpMenuItem).toBeVisible();
        await expect(helpMenuItem).toContainText('Help');
      });

      test('clicking help menu entry opens help dialog', async () => {
        const helpMenuItem = appMenuWindow.locator('[data-testid="help-menu-entry"]');
        await helpMenuItem.click();

        // Wait for help dialog window to appear
        helpWindow = await electron.waitForWindow(
          ({url}) => url.includes('help/index.html')
        );
        expect(helpWindow).toBeDefined();
      });

      test('help dialog has correct title', async () => {
        const title = await helpWindow.title();
        expect(title).toContain('Help');
      });

      describe('help dialog content', () => {
        test('displays Help headline in top app bar', async () => {
          const headline = helpWindow.locator('.top-app-bar__headline');
          await expect(headline).toBeVisible();
          await expect(headline).toHaveText('Help');
        });

        test('displays Table of Contents', async () => {
          const toc = helpWindow.locator('.toc-container');
          await expect(toc).toBeVisible();
          const tocHeading = toc.locator('h1');
          await expect(tocHeading).toHaveText('Table of Contents');
        });

        test('Table of Contents has Setup section link', async () => {
          const setupLink = helpWindow.locator('.toc-container a[href="#Setup.md"]');
          await expect(setupLink).toBeVisible();
          await expect(setupLink).toContainText('Setup');
        });

        test('Table of Contents has Keyboard Shortcuts section link', async () => {
          const keyboardLink = helpWindow.locator('.toc-container a[href="#Keyboard-shortcuts.md"]');
          await expect(keyboardLink).toBeVisible();
          await expect(keyboardLink).toContainText('Keyboard Shortcuts');
        });

        test('Table of Contents has Troubleshooting section link', async () => {
          const troubleshootingLink = helpWindow.locator('.toc-container a[href="#Troubleshooting.md"]');
          await expect(troubleshootingLink).toBeVisible();
          await expect(troubleshootingLink).toContainText('Troubleshooting');
        });

        test('Table of Contents has sublevel items', async () => {
          const sublevelItems = helpWindow.locator('.toc-container .toc-sublevel');
          await expect(sublevelItems.first()).toBeVisible();
        });

        test('documents container displays Setup section', async () => {
          const setupHeading = helpWindow.locator('.documents-container h1#Setup\\.md');
          await expect(setupHeading).toBeVisible();
          await expect(setupHeading).toHaveText('Setup');
        });

        test('documents container displays Keyboard Shortcuts section', async () => {
          const keyboardHeading = helpWindow.locator('.documents-container h1#Keyboard-shortcuts\\.md');
          await expect(keyboardHeading).toBeVisible();
          await expect(keyboardHeading).toHaveText('Keyboard Shortcuts');
        });

        test('documents container displays Troubleshooting section', async () => {
          const troubleshootingHeading = helpWindow.locator('.documents-container h1#Troubleshooting\\.md');
          await expect(troubleshootingHeading).toBeVisible();
          await expect(troubleshootingHeading).toHaveText('Troubleshooting');
        });

        test('displays version in footer', async () => {
          const footer = helpWindow.locator('.documents-footer');
          await expect(footer).toBeVisible();
          const footerText = await footer.textContent();
          expect(footerText).toMatch(/ElectronIM version \d+\.\d+\.\d+/);
        });
      });

      describe('table of contents navigation', () => {
        test('clicking Setup ToC link scrolls to Setup section', async () => {
          const setupLink = helpWindow.locator('.toc-container a[href="#Setup.md"]');
          await setupLink.click();

          // Wait for URL hash to change
          await electron.waitForCondition(
            async () => helpWindow.url().includes('#Setup.md'),
            {timeout: 2000, message: 'URL hash did not change to #Setup.md'}
          );

          // Verify the Setup section is in viewport
          const setupHeading = helpWindow.locator('#Setup\\.md');
          await expect(setupHeading).toBeInViewport();
        });

        test('clicking Keyboard Shortcuts ToC link scrolls to Keyboard Shortcuts section', async () => {
          const keyboardLink = helpWindow.locator('.toc-container a[href="#Keyboard-shortcuts.md"]');
          await keyboardLink.click();

          // Wait for URL hash to change
          await electron.waitForCondition(
            async () => helpWindow.url().includes('#Keyboard-shortcuts.md'),
            {timeout: 2000, message: 'URL hash did not change to #Keyboard-shortcuts.md'}
          );

          // Verify the Keyboard Shortcuts section is in viewport
          const keyboardHeading = helpWindow.locator('#Keyboard-shortcuts\\.md');
          await expect(keyboardHeading).toBeInViewport();
        });

        test('clicking Troubleshooting ToC link scrolls to Troubleshooting section', async () => {
          const troubleshootingLink = helpWindow.locator('.toc-container a[href="#Troubleshooting.md"]');
          await troubleshootingLink.click();

          // Wait for URL hash to change
          await electron.waitForCondition(
            async () => helpWindow.url().includes('#Troubleshooting.md'),
            {timeout: 2000, message: 'URL hash did not change to #Troubleshooting.md'}
          );

          // Verify the Troubleshooting section is in viewport
          const troubleshootingHeading = helpWindow.locator('#Troubleshooting\\.md');
          await expect(troubleshootingHeading).toBeInViewport();
        });

        test('clicking sublevel ToC link scrolls to subsection', async () => {
          // Click on a sublevel link (e.g., "Install" under Setup)
          const sublevelLink = helpWindow.locator('.toc-container .toc-sublevel a').first();
          const href = await sublevelLink.getAttribute('href');
          await sublevelLink.click();

          // Wait for URL hash to change
          await electron.waitForCondition(
            async () => helpWindow.url().includes(href),
            {timeout: 2000, message: `URL hash did not change to ${href}`}
          );

          // Extract the ID from href and verify the element is in viewport
          const targetId = href.replace('#', '').replace(/__/g, '__');
          const targetElement = helpWindow.locator(`#${targetId.replace(/\./g, '\\.')}`);
          await expect(targetElement).toBeInViewport();
        });
      });

      describe('closing help dialog', () => {
        test('help dialog has close button in top app bar', async () => {
          const closeButton = helpWindow.locator('.top-app-bar .leading-navigation-icon');
          await expect(closeButton).toBeVisible();
        });

        test('clicking close button closes help dialog', async () => {
          const closeButton = helpWindow.locator('.top-app-bar .leading-navigation-icon');
          await closeButton.click();

          // Wait a moment for the dialog to close
          await new Promise(resolve => setTimeout(resolve, 500));

          // Verify help dialog is no longer in the windows list
          const helpStillExists = electron.app.windows().some(
            window => window.url().includes('help/index.html')
          );
          expect(helpStillExists).toBe(false);
        });
      });
    });
  });
});
