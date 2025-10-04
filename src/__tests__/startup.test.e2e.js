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

const {devTools, getFreePort, spawnElectron} = require('./');

const STARTUP_TIMEOUT = 15000;

describe('E2E :: Application startup test suite', () => {
  let devtoolsPort;

  beforeAll(async () => {
    devtoolsPort = await getFreePort();
  });

  describe('with valid environment', () => {
    let devToolsClient;
    let electron;

    beforeAll(async () => {
      devToolsClient = devTools({port: devtoolsPort});
      electron = spawnElectron({devtoolsPort});
      await electron.waitForDebugger(STARTUP_TIMEOUT);
      await devToolsClient.connect();
    }, STARTUP_TIMEOUT);

    afterAll(async () => Promise.all([devToolsClient.close(), electron.kill()]));

    test('starts the application', () => {
      expect(electron.process.pid).toBeDefined();
    });

    test('creates main window with DevTools indicators', () => {
      expect(electron.stderr).toMatch(/(DevTools|Debugger) listening on ws:\/\//);
    });

    test('captures stdout output', () => {
      expect(typeof electron.stdout).toBe('string');
    });

    test('captures stderr output', () => {
      expect(typeof electron.stderr).toBe('string');
    });

    test('initializes with process ID', () => {
      expect(typeof electron.process.pid).toBe('number');
      expect(electron.process.pid).toBeGreaterThan(0);
    });

    test('connects to Chrome DevTools Protocol', () => {
      expect(devToolsClient.connected).toBeTrue();
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
