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
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const STARTUP_TIMEOUT = 15000;

describe('E2E :: First-time install test suite', () => {
  let devtoolsPort;
  let tempDir;
  let emptySettingsPath;

  beforeAll(async () => {
    devtoolsPort = await getFreePort();

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
    let devToolsClient;
    let electron;

    beforeAll(async () => {
      devToolsClient = devTools({port: devtoolsPort});
      electron = spawnElectron({devtoolsPort, extraArgs: ['--settings-path', emptySettingsPath]});
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

    describe('settings-dialog', () => {
      let DOM;
      let Runtime;
      beforeAll(async () => {
        // Wait for settings dialog to appear (it should appear automatically when no tabs are configured)
        const targetInfo = await devToolsClient.target(t =>
          t.type === 'page' &&
          t.url.includes('settings/index.html')
        );
        DOM = targetInfo.DOM;
        Runtime = targetInfo.Runtime;
      }, STARTUP_TIMEOUT);

      test('verifies settings dialog is displayed', async () => {
        const {root} = await DOM.getDocument();
        const {nodeId} = await DOM.querySelector({nodeId: root.nodeId, selector: '.settings'});
        expect(nodeId).toBeGreaterThan(0);
      });

      test('verifies settings dialog has services pane', async () => {
        const {root} = await DOM.getDocument();
        const {nodeId} = await DOM.querySelector({nodeId: root.nodeId, selector: '.settings__services'});
        expect(nodeId).toBeGreaterThan(0);
      });

      test('can execute JavaScript in the settings dialog', async () => {
        const result = await Runtime.evaluate({
          expression: 'document.title'
        });
        expect(result.result.value).toContain('Settings');
      });

      test('can add a new service by typing URL and clicking add button', async () => {
        // Get the input field for new service URL
        const {root} = await DOM.getDocument();
        const {nodeId: inputNodeId} = await DOM.querySelector({
          nodeId: root.nodeId,
          selector: '.settings__new-tab input'
        });
        expect(inputNodeId).toBeGreaterThan(0);

        // Type the URL by setting attributes and triggering input event
        await DOM.setAttributeValue({nodeId: inputNodeId, name: 'value', value: 'https://web.whatsapp.com'});

        // Trigger the input event using Runtime
        await Runtime.evaluate({
          expression: `
            const input = document.querySelector('.settings__new-tab input');
            input.value = 'https://web.whatsapp.com';
            input.dispatchEvent(new Event('input', { bubbles: true }));
          `
        });

        // Wait for validation to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get the add button node and click it
        const {nodeId: addButtonNodeId} = await DOM.querySelector({
          nodeId: root.nodeId,
          selector: '.settings__new-tab .material3.icon-button'
        });
        expect(addButtonNodeId).toBeGreaterThan(0);

        // Verify button is not disabled
        const {attributes} = await DOM.getAttributes({nodeId: addButtonNodeId});
        expect(attributes.includes('disabled')).toBe(false);

        // Click the add button using DOM API
        await Runtime.evaluate({
          expression: 'document.querySelector(\'.settings__new-tab .material3.icon-button\').click()'
        });

        // Wait for the tab to be added to the DOM
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verify the service was added to the list
        const tabCount = await Runtime.evaluate({
          expression: 'document.querySelectorAll(\'.settings__tabs .settings__tab\').length'
        });
        expect(tabCount.result.value).toBe(1);

        const firstTabUrl = await Runtime.evaluate({
          expression: `
            const tabInput = document.querySelector('.settings__tabs .settings__tab .settings__tab-main input');
            tabInput ? tabInput.value : null;
          `
        });
        expect(firstTabUrl.result.value).toBe('https://web.whatsapp.com');

        // Verify the input field is cleared
        const inputCleared = await Runtime.evaluate({
          expression: 'document.querySelector(\'.settings__new-tab input\').value'
        });
        expect(inputCleared.result.value).toBe('');
      });
    });
  });
});
