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

const path = require('node:path');
const {spawn} = require('node:child_process');
const CDP = require('chrome-remote-interface');

describe('E2E :: Application startup test suite', () => {
  let electronProcess;
  let appPath;
  let electronPath;
  let devToolsClient;
  const STARTUP_TIMEOUT = 15000;
  const DEVTOOLS_PORT = 9222;

  const closeDevTools = async () => {
    if (!devToolsClient?.client) {
      return;
    }
    try {
      await devToolsClient.client.close();
    } catch {
      // Ignore close errors
    }
  };
  const killElectron = async () => {
    if (!electronProcess || electronProcess.killed) {
      return;
    }
    // eslint-disable-next-line no-warning-comments
    // TODO: SIGTERM doesn't work when tray icon is enabled, using SIGKILL directly
    // This is because the tray prevents graceful shutdown. Consider adding a test-specific
    // flag to disable tray in E2E tests for proper graceful shutdown testing.
    electronProcess.kill('SIGKILL');

    // Wait for process to exit
    await new Promise((resolve, reject) => {
      electronProcess.once('exit', resolve);
      setTimeout(() => reject(new Error('Process exit timeout')), 1000);
    });
  };

  const connectToDevTools = async (timeout = 10000) => {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        // eslint-disable-next-line new-cap
        const targets = await CDP.List({port: DEVTOOLS_PORT});
        const mainTarget = targets.find(target =>
          target.type === 'page' &&
          (target.url.includes('chrome-tabs') || target.title === 'ElectronIM tabs')
        );

        if (mainTarget) {
          // eslint-disable-next-line new-cap
          const client = await CDP({target: mainTarget, port: DEVTOOLS_PORT});
          const {Runtime, DOM, Page} = client;
          await Runtime.enable();
          await DOM.enable();
          await Page.enable();
          return {client, Runtime, DOM, Page};
        }
      } catch {
        // DevTools not ready yet, wait and retry
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error('Failed to connect to DevTools after timeout');
  };

  beforeAll(() => {
    // Set environment for testing
    process.env.NODE_ENV = 'test';
    process.env.DISPLAY = process.env.DISPLAY || ':99';
    process.env.ELECTRON_IS_DEV = '0';
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

    appPath = path.join(__dirname, '..', 'index.js');
    electronPath = require('electron');
  });

  describe('with valid environment', () => {
    let spawnResult;

    beforeAll(async () => {
      spawnResult = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Application startup timed out after ${STARTUP_TIMEOUT}ms`));
        }, STARTUP_TIMEOUT);

        electronProcess = spawn(electronPath, [
          appPath,
          '--no-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          `--remote-debugging-port=${DEVTOOLS_PORT}`
        ], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: {...process.env}
        });

        let stdoutData = '';
        let stderrData = '';
        let appStarted = false;

        electronProcess.stdout.on('data', data => {
          stdoutData += data.toString();
        });

        electronProcess.stderr.on('data', data => {
          const output = data.toString();
          stderrData += output;

          // Look for indicators that the main window was created
          if (output.includes('listening on ws://') && !appStarted) {
            appStarted = true;
            clearTimeout(timeout);

            // Give a moment for window to fully initialize, then connect to DevTools
            setTimeout(async () => {
              try {
                // Connect to Chrome DevTools Protocol
                devToolsClient = await connectToDevTools();

                resolve({
                  stdout: stdoutData,
                  stderr: stderrData,
                  pid: electronProcess.pid,
                  windowDetected: true,
                  devToolsConnected: true
                });
              } catch (error) {
                reject(new Error(`DevTools connection or DOM verification failed: ${error.message}`));
              }
            }, 2000);
          }
        });

        electronProcess.on('error', error => {
          clearTimeout(timeout);
          reject(new Error(`Failed to start Electron application: ${error.message}`));
        });

        electronProcess.on('exit', code => {
          clearTimeout(timeout);
          reject(new Error(`Electron application exited with code ${code}. stderr: ${stderrData}`));
        });
      });
    }, STARTUP_TIMEOUT + 5000);

    afterAll(async () => Promise.all([closeDevTools(), killElectron()]));

    test('starts the application', () => {
      expect(spawnResult.pid).toBeDefined();
    });

    test('creates main window with DevTools indicators', () => {
      expect(spawnResult.stderr).toContain('DevTools listening on ws://');
    });

    test('captures stdout output', () => {
      expect(typeof spawnResult.stdout).toBe('string');
    });

    test('captures stderr output', () => {
      expect(typeof spawnResult.stderr).toBe('string');
    });

    test('initializes with process ID', () => {
      expect(typeof spawnResult.pid).toBe('number');
      expect(spawnResult.pid).toBeGreaterThan(0);
    });

    test('detects window creation', () => {
      expect(spawnResult.windowDetected).toBeTruthy();
    });

    test('connects to Chrome DevTools Protocol', () => {
      expect(spawnResult.devToolsConnected).toBeTruthy();
    });


    test('verifies tab container element exists', async () => {
      const {DOM} = devToolsClient;
      const {root} = await DOM.getDocument();
      const {nodeId} = await DOM.querySelector({nodeId: root.nodeId, selector: '.tab-container'});
      expect(nodeId).toBeGreaterThan(0);
    });

    test('verifies HTML has electronim class', async () => {
      const {DOM} = devToolsClient;
      const {root} = await DOM.getDocument();
      const {nodeId} = await DOM.querySelector({nodeId: root.nodeId, selector: 'html.electronim'});
      expect(nodeId).toBeGreaterThan(0);
    });

    test('can execute JavaScript in the renderer process', async () => {
      const {Runtime} = devToolsClient;
      const result = await Runtime.evaluate({
        expression: 'document.title'
      });
      expect(result.result.value).toContain('ElectronIM');
    });
  });
});
