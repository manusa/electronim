/*
   Copyright 2022 Marc Nuri San Felix

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
describe('App Menu Module preload test suite', () => {
  let electron;
  beforeEach(() => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
  });
  describe('preload (just for coverage and sanity, see bundle tests)', () => {
    beforeEach(() => {
      globalThis.APP_EVENTS = require('../../constants').APP_EVENTS;
      electron.ipcMain.on('chromeExtensionsEnabled', event => {
        event.returnValue = false;
      });
      require('../preload');
    });
    test('creates an API', () => {
      expect(electron.contextBridge.exposeInMainWorld).toHaveBeenCalledWith('electron', {
        aboutOpenDialog: expect.toBeFunction(),
        chromeExtensionsEnabled: expect.toBeBoolean(),
        chromeWebStoreOpenDialog: expect.toBeFunction(),
        close: expect.toBeFunction(),
        helpOpenDialog: expect.toBeFunction(),
        quit: expect.toBeFunction(),
        settingsOpenDialog: expect.toBeFunction()
      });
    });
    describe('API', () => {
      let api;
      beforeEach(() => {
        api = electron.contextBridge.exposeInMainWorld.mock.calls[0][1];
      });
      test.each([
        ['aboutOpenDialog', 'aboutOpenDialog', 'send'],
        ['chromeWebStoreOpenDialog', 'chromeWebStoreOpenDialog', 'send'],
        ['close', 'appMenuClose', 'send'],
        ['helpOpenDialog', 'helpOpenDialog', 'send'],
        ['quit', 'quit', 'send'],
        ['settingsOpenDialog', 'settingsOpenDialog', 'send']
      ])('%s invokes %s', (apiMethod, event, method) => {
        api[apiMethod]();
        expect(electron.ipcRenderer[method]).toHaveBeenCalledWith(event);
      });
      test('chromeExtensionsEnabled is a boolean value', () => {
        expect(api.chromeExtensionsEnabled).toBeBoolean();
      });
    });
  });
  describe('preload.bundle', () => {
    beforeEach(() => {
      electron.ipcMain.on('chromeExtensionsEnabled', event => {
        event.returnValue = false;
      });
      require('../../../bundles/app-menu.preload');
    });
    test('creates an API', () => {
      expect(electron.contextBridge.exposeInMainWorld).toHaveBeenCalledWith('electron', {
        aboutOpenDialog: expect.toBeFunction(),
        chromeExtensionsEnabled: expect.toBeBoolean(),
        chromeWebStoreOpenDialog: expect.toBeFunction(),
        close: expect.toBeFunction(),
        helpOpenDialog: expect.toBeFunction(),
        quit: expect.toBeFunction(),
        settingsOpenDialog: expect.toBeFunction()
      });
    });
  });
});
