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
const {spawnElectron, createTestServer, expect} = require('./');

// What this suite covers, and just as importantly what it does not.
//
// Covers the open -> scrim click -> close -> reopen chain end to end. Every link in it is already
// tested in isolation, but only with its neighbours mocked: app-menu.browser.test.mjs fires the
// wrapper click in JSDOM, preload.test.js maps close to the appMenuClose channel, and
// global-listeners.test.js drives the main process side. Nothing proved that a real scrim click in
// a real renderer reaches the real main process and leaves the menu reopenable, which is the gap
// this closes. It catches a broken scrim handler, a bad guard in appMenuOpen, or a menu that fails
// to be rebuilt for the next open.
//
// It does NOT prove the reopened menu is visible to the user, and must never be read as if it did.
// A WebContentsView can be attached, visible, correctly bounded and backed by a perfectly healthy
// renderer while compositing nothing - which is exactly what happens on Linux when a view is
// attached a second time (see the comment above destroyAppMenu in src/main/index.js). In that
// state isDestroyed() is false, isLoading() is false, the DOM is laid out, and every assertion
// below still passes while the window is in fact blank and dead to both mouse and keyboard.
// Playwright cannot see it: DOM visibility is a renderer-side property and the renderer is fine;
// what fails is that the view's composited output never reaches the window. Catching that requires
// scoring the composited window from outside the process (real input via XTEST, real screen
// capture), which is what the experiment/x11-repaint-harness branch exists for.
//
// So: do not rename this suite into something that claims to guard the repaint bug, and do not
// treat a green run here as evidence that reopening the menu works on Linux.
describe('E2E :: App menu reopen test suite', () => {
  let electron;
  let chromeTabsView;
  let testServer;

  const openAppMenu = async () => {
    await chromeTabsView.locator('.menu__button').click();
    return electron.waitForWindow(({url}) => url.includes('app-menu/index.html'));
  };

  beforeAll(async () => {
    testServer = await createTestServer({manualCleanup: true});
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
    chromeTabsView = await electron.waitForWindow(
      ({url, title}) => url.includes('chrome-tabs') || title === 'ElectronIM tabs');
  });

  afterAll(async () => {
    await Promise.all([electron.kill(), testServer.close()]);
  });

  describe('closing the app menu by clicking the scrim', () => {
    let firstAppMenu;

    beforeAll(async () => {
      firstAppMenu = await openAppMenu();
      await expect(firstAppMenu.locator('[data-testid="about-menu-entry"]')).toBeVisible();
      // The scrim fills the window while the menu itself is right aligned, so its top left corner
      // is scrim and nothing else. The click bubbles up to .wrapper, which is what calls close().
      await firstAppMenu.locator('.scrim').click({position: {x: 10, y: 10}});
    });

    test('releases the app menu renderer', async () => {
      await expect.poll(() => firstAppMenu.isClosed()).toBe(true);
    });
  });

  describe('reopening the app menu after a scrim close', () => {
    let reopenedAppMenu;

    beforeAll(async () => {
      reopenedAppMenu = await openAppMenu();
    });

    test('opens an app menu again', () => {
      expect(reopenedAppMenu).toBeDefined();
    });

    test('serves it from a live renderer, not the released one', () => {
      expect(reopenedAppMenu.isClosed()).toBe(false);
    });

    test('shows the menu entries', async () => {
      await expect(reopenedAppMenu.locator('[data-testid="about-menu-entry"]')).toBeVisible();
    });

    test('still routes clicks on those entries', async () => {
      await reopenedAppMenu.locator('[data-testid="about-menu-entry"]').click();
      const aboutWindow = await electron.waitForWindow(({url}) => url.includes('about/index.html'));
      expect(aboutWindow).toBeDefined();
    });
  });
});
