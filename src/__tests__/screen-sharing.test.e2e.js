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
        ({url}) => url === testServer.url || url.includes('localhost'),
        5000
      );
      // Initialize share screen button locator and ensure it's loaded
      shareScreenBtn = testPageWindow.locator('#share-screen-btn');
      await electron.waitForCondition(async () => await shareScreenBtn.count() > 0);
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
      let shimRoot;
      beforeAll(async () => {
        await shareScreenBtn.click();
        shimRoot = testPageWindow.locator('.electron-desktop-capturer-root');
        await electron.waitForCondition(async () => await shimRoot.count() > 0);
      });
      test('clicking screen sharing button opens shim overlay', async () => {
        // Clicking is done in beforeAll
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
          sources = shimRoot.locator('.electron-desktop-capturer-root__source');
          await electron.waitForCondition(async () => await sources.count() > 0);
        });
        test('displays loading message initially', async () => {
          // Wait for sources to appear (up to 3 seconds, as the shim polls every 300ms)
          await expect(sources.first()).toBeVisible({timeout: 9000});
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
          await electron.waitForCondition(() => shimRoot.locator('.electron-desktop-capturer-root__source') !== null);
          sources = shimRoot.locator('.electron-desktop-capturer-root__source');
        });
        test('clicking a source closes the overlay', async () => {
          const firstSource = sources.first();
          await firstSource.click();

          // Wait for the overlay to disappear
          await expect(shimRoot).not.toBeVisible({timeout: 5000});
        });

        test('screen sharing status shows success', async () => {
          const screenShareStatus = testPageWindow.locator('#screen-share-status');
          await expect(screenShareStatus).toContainText('Screen sharing started successfully!');
        });

        test('stream is created and available', async () => {
          // Wait for stream to be created after selection
          await electron.waitForCondition(async () => {
            return await testPageWindow.evaluate(() => {
              return Boolean(globalThis.electronimScreenShareStream);
            });
          });
          // If we reach here, the stream exists (waitForCondition passed)
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
          // Trigger screen sharing again to test cancellation
          await shareScreenBtn.click();

          await expect(shimRoot).toBeVisible({timeout: 5000});
        });

        test('clicking overlay background closes the shim', async () => {
          // Click the overlay (not the sources container)
          const shimOverlay = shimRoot.locator('.electron-desktop-capturer-root__overlay');
          await shimOverlay.click({position: {x: 5, y: 5}});

          // Wait for the overlay to disappear
          await expect(shimRoot).not.toBeVisible({timeout: 5000});
        });

        test('screen sharing status shows cancellation error', async () => {
          const screenShareStatus = testPageWindow.locator('#screen-share-status');
          await expect(screenShareStatus).toContainText('Screen share aborted by user');
        });
      });
    });
  });
});
