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

describe('E2E :: Screen sharing test suite', () => {
  describe('screen sharing functionality', () => {
    let electron;
    let testServer;
    let testPageWindow;
    let shareScreenBtn;
    let shimRoot;

    /**
     * Helper to check if the overlay is currently visible.
     * Returns false if element doesn't exist or is not visible.
     */
    const isOverlayVisible = async () => {
      try {
        const count = await shimRoot.count();
        if (count === 0) {
          return false;
        }
        return await shimRoot.isVisible();
      } catch {
        return false;
      }
    };

    /**
     * Helper to ensure overlay is closed before proceeding.
     * Clicks overlay background if it's open to close it.
     */
    const ensureOverlayClosed = async () => {
      if (await isOverlayVisible()) {
        // Try to close by clicking the overlay background
        try {
          const shimOverlay = shimRoot.locator('.electron-desktop-capturer-root__overlay');
          await shimOverlay.click({position: {x: 5, y: 5}, timeout: 2000});
        } catch {
          // Ignore click errors
        }
        // Wait for overlay to close
        await electron.waitForCondition(
          async () => !(await isOverlayVisible()),
          {timeout: 5000, interval: 100, message: 'Failed to close overlay'}
        );
      }
    };

    /**
     * Helper to open the overlay and wait for it to be visible.
     */
    const openOverlay = async () => {
      await shareScreenBtn.click();
      await electron.waitForCondition(
        async () => await isOverlayVisible(),
        {timeout: 10000, interval: 100, message: 'Screen sharing overlay did not appear'}
      );
    };

    /**
     * Helper to wait for sources to load and return the sources locator.
     * Increased timeout to 15s to handle slow CI environments.
     */
    const waitForSources = async () => {
      const sources = shimRoot.locator('.electron-desktop-capturer-root__source');
      await electron.waitForCondition(
        async () => await sources.count() > 0,
        {timeout: 15000, interval: 300, message: 'Screen sharing sources did not load'}
      );
      // Additional wait for first source to be visible and stable
      await sources.first().waitFor({state: 'visible', timeout: 5000});
      return sources;
    };

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
      // Wait for the test page window to appear
      testPageWindow = await electron.waitForWindow(
        ({url}) => url === testServer.url || url.includes('localhost'));

      // Initialize locators
      shareScreenBtn = testPageWindow.locator('#share-screen-btn');
      shimRoot = testPageWindow.locator('.electron-desktop-capturer-root');

      // Wait for share screen button to be loaded and visible
      await electron.waitForCondition(
        async () => await shareScreenBtn.count() > 0,
        {timeout: 10000, interval: 100, message: 'Share screen button did not appear'}
      );
      await shareScreenBtn.waitFor({state: 'visible', timeout: 5000});
    });

    afterAll(async () => {
      await Promise.all([electron.kill(), testServer.close()]);
    });

    test('starts the application', () => {
      expect(electron.app).toBeDefined();
    });

    test('test page window is created', () => {
      expect(testPageWindow).toBeDefined();
    });

    describe('screen sharing button', () => {
      test('screen sharing button is visible', async () => {
        await expect(shareScreenBtn).toBeVisible();
      });

      test('screen sharing button has correct text', async () => {
        await expect(shareScreenBtn).toContainText('Start Screen Sharing');
      });
    });

    describe('mediadevices shim overlay', () => {
      beforeAll(async () => {
        // Ensure clean state - close any existing overlay
        await ensureOverlayClosed();
        // Open the overlay
        await openOverlay();
      });

      test('clicking screen sharing button opens shim overlay', async () => {
        await expect(shimRoot).toBeVisible({timeout: 5000});
      });

      test('shim overlay has overlay container', async () => {
        const shimOverlay = shimRoot.locator('.electron-desktop-capturer-root__overlay');
        await expect(shimOverlay).toBeVisible();
      });

      test('shim overlay has sources container', async () => {
        const shimSources = shimRoot.locator('.electron-desktop-capturer-root__sources');
        await expect(shimSources).toBeVisible();
      });

      describe('sources list', () => {
        let sources;

        beforeAll(async () => {
          // Always close and reopen overlay to ensure fresh state with sources loading
          // This prevents issues where the overlay appears open but sources stopped loading
          await ensureOverlayClosed();
          await openOverlay();
          sources = await waitForSources();
        });

        test('displays available sources', async () => {
          expect(await sources.count()).toBeGreaterThan(0);
        });

        test('each source has a name', async () => {
          const firstSource = sources.first();
          const sourceName = firstSource.locator('.electron-desktop-capturer-root__name');
          await expect(sourceName).toBeVisible();
          const nameText = await sourceName.textContent();
          expect(nameText.length).toBeGreaterThan(0);
        });

        test('each source has a thumbnail or placeholder', async () => {
          const firstSource = sources.first();
          // Should have either a thumbnail image or a placeholder
          const thumbnail = firstSource.locator('.electron-desktop-capturer-root__thumbnail');
          await expect(thumbnail).toBeVisible();
        });

        test('sources are clickable', async () => {
          const firstSource = sources.first();
          // Verify the cursor style indicates it's clickable
          const cursor = await firstSource.evaluate(el => globalThis.getComputedStyle(el).cursor);
          expect(cursor).toBe('pointer');
        });
      });

      describe('selecting a source', () => {
        let sources;

        beforeAll(async () => {
          // Overlay should already be open with sources from 'sources list' tests
          // If not visible, reopen it
          if (!(await isOverlayVisible())) {
            await openOverlay();
          }
          // Get the sources locator - they should already be loaded
          sources = shimRoot.locator('.electron-desktop-capturer-root__source');
          // Verify sources are available, wait if needed
          const count = await sources.count();
          if (count === 0) {
            sources = await waitForSources();
          }
        });

        test('clicking a source closes the overlay', async () => {
          const firstSource = sources.first();
          await firstSource.click();

          // Wait for the overlay to disappear
          await electron.waitForCondition(
            async () => !(await isOverlayVisible()),
            {timeout: 10000, interval: 100, message: 'Overlay did not close after selecting source'}
          );
        });

        test('screen sharing status shows success', async () => {
          const screenShareStatus = testPageWindow.locator('#screen-share-status');
          await expect(screenShareStatus).toContainText('Screen sharing started successfully!');
        });

        test('stream is created and available', async () => {
          // Wait for stream to be created after selection
          await electron.waitForCondition(
            async () => {
              return await testPageWindow.evaluate(() => {
                return Boolean(globalThis.electronimScreenShareStream);
              });
            },
            {timeout: 10000, interval: 100, message: 'Screen share stream was not created'}
          );
          const hasStream = await testPageWindow.evaluate(() => {
            return Boolean(globalThis.electronimScreenShareStream);
          });
          expect(hasStream).toBe(true);
        });

        test('stream has video tracks', async () => {
          const trackCount = await testPageWindow.evaluate(() => {
            const stream = globalThis.electronimScreenShareStream;
            return stream ? stream.getVideoTracks().length : 0;
          });
          expect(trackCount).toBeGreaterThan(0);
        });

        test('video track is active', async () => {
          const trackActive = await testPageWindow.evaluate(() => {
            const stream = globalThis.electronimScreenShareStream;
            const tracks = stream?.getVideoTracks();
            return tracks?.[0]?.readyState === 'live';
          });
          expect(trackActive).toBe(true);
        });
      });

      describe('canceling screen sharing', () => {
        beforeAll(async () => {
          // Ensure any previous overlay is closed
          await ensureOverlayClosed();

          // Open overlay for cancellation test
          // Note: We don't need to wait for sources to test cancellation
          await openOverlay();
        });

        test('clicking overlay background closes the shim', async () => {
          // Click the overlay (not the sources container)
          const shimOverlay = shimRoot.locator('.electron-desktop-capturer-root__overlay');
          await shimOverlay.click({position: {x: 5, y: 5}});

          // Wait for the overlay to disappear
          await electron.waitForCondition(
            async () => !(await isOverlayVisible()),
            {timeout: 10000, interval: 100, message: 'Overlay did not close after clicking background'}
          );
        });

        test('screen sharing status shows cancellation error', async () => {
          const screenShareStatus = testPageWindow.locator('#screen-share-status');
          await expect(screenShareStatus).toContainText('Screen share aborted by user');
        });
      });
    });
  });
});
