/*
   Copyright 2019 Marc Nuri San Felix

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
describe('Help Module preload test suite', () => {
  let electron;
  beforeEach(() => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    window.APP_EVENTS = require('../../constants').APP_EVENTS;
  });
  describe('preload (just for coverage and sanity, see bundle tests)', () => {
    beforeEach(() => {
      jest.mock('../help.browser.css', () => {});
      jest.mock('!val-loader!./docs.browser.val-loader', () => ({
        docs: {
          one: 'this is a doc'
        }
      }), {virtual: true});
      require('../preload');
    });
    describe('creates an API', () => {
      test('with doc entries', () => {
        expect(electron.contextBridge.exposeInMainWorld).toHaveBeenCalledWith('electron', {
          close: expect.toBeFunction(),
          docs: {one: 'this is a doc'}
        });
      });
      test('with close function', () => {
        const electronApi = electron.contextBridge.exposeInMainWorld.mock.calls[0][1];
        electronApi.close();
        expect(electron.ipcRenderer.send).toHaveBeenCalledWith('closeDialog');
      });
    });
  });
  describe('preload.bundle', () => {
    beforeEach(() => {
      require('../../../bundles/help.preload');
    });
    test('loads document contents with valid asset URLs', () => {
      const electronApi = electron.contextBridge.exposeInMainWorld.mock.calls[0][1];
      expect(electronApi.docs).toEqual(expect.objectContaining({
        'Keyboard-shortcuts.md': expect.stringMatching(/<h1>Keyboard Shortcuts/i),
        'Roadmap.md': expect.any(String),
        'Screenshots.md': expect.stringContaining('<img src="../../docs/screenshots/main.png" alt="Main" />'),
        'Setup.md': expect.stringMatching(/There are several options available/i),
        'Troubleshooting.md': expect.any(String)
      }));
    });
  });
});
