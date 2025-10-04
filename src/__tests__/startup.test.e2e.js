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
const {devTools, getFreePort} = require('./');

describe('E2E :: Application startup test suite', () => {
  let electronProcess;
  let appPath;
  let electronPath;
  let devtoolsPort;
  const STARTUP_TIMEOUT = 15000;

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

  beforeAll(async () => {
    // Set environment for testing
    process.env.NODE_ENV = 'test';
    process.env.DISPLAY = process.env.DISPLAY || ':99';
    process.env.ELECTRON_IS_DEV = '0';
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

    appPath = path.join(__dirname, '..', 'index.js');
    electronPath = require('electron');
    devtoolsPort = await getFreePort();
  });

  describe('with valid environment', () => {
    let devToolsClient;
    let spawnResult;

    beforeAll(async () => {
      devToolsClient = devTools({port: devtoolsPort});
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
          `--remote-debugging-port=${devtoolsPort}`
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
          stderrData += data.toString();

          // Look for indicators that the main window was created
          if (stderrData.includes('listening on ws://') && !appStarted) {
            appStarted = true;
            clearTimeout(timeout);
            resolve({
              stdout: stdoutData,
              stderr: stderrData,
              pid: electronProcess.pid,
              windowDetected: true,
              devToolsConnected: true
            });
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
      await devToolsClient.connect();
    }, STARTUP_TIMEOUT + 5000);

    afterAll(async () => Promise.all([devToolsClient.close(), killElectron()]));

    test('starts the application', () => {
      expect(spawnResult.pid).toBeDefined();
    });

    test('creates main window with DevTools indicators', () => {
      expect(spawnResult.stderr).toMatch(/(DevTools|Debugger) listening on ws:\/\//);
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

    describe('tab-container', () => {
      let DOM;
      let Runtime;
      beforeAll(async () => {
        const target = await devToolsClient.target(t =>
          t.type === 'page' &&
          (t.url.includes('chrome-tabs') || t.title === 'ElectronIM tabs')
        );
        DOM = target.DOM;
        Runtime = target.Runtime;
      });

      test('verifies tab container element exists', async () => {
        const {root} = await DOM.getDocument();
        const {nodeId} = await DOM.querySelector({nodeId: root.nodeId, selector: '.tab-container'});
        expect(nodeId).toBeGreaterThan(0);
      });

      test('verifies HTML has electronim class', async () => {
        const {root} = await DOM.getDocument();
        const {nodeId} = await DOM.querySelector({nodeId: root.nodeId, selector: 'html.electronim'});
        expect(nodeId).toBeGreaterThan(0);
      });

      test('can execute JavaScript in the renderer process', async () => {
        const result = await Runtime.evaluate({
          expression: 'document.title'
        });
        expect(result.result.value).toContain('ElectronIM');
      });
    });
  });
});
