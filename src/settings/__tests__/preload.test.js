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
describe('Settings Module preload test suite', () => {
  let electron;
  beforeEach(() => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    globalThis.APP_EVENTS = require('../../constants').APP_EVENTS;
  });
  describe('preload (just for coverage and sanity, see bundle tests)', () => {
    beforeEach(() => {
      require('../preload');
    });
    describe('creates an API', () => {
      test('with entries', () => {
        expect(electron.contextBridge.exposeInMainWorld).toHaveBeenCalledWith('electron', {
          closeDialog: expect.toBeFunction(),
          settingsSave: expect.toBeFunction(),
          settingsLoad: expect.toBeFunction(),
          settingsExport: expect.toBeFunction(),
          settingsImport: expect.toBeFunction(),
          settingsOpenFolder: expect.toBeFunction(),
          dictionaryGetAvailable: expect.toBeFunction(),
          dictionaryGetAvailableNative: expect.toBeFunction(),
          dictionaryGetEnabled: expect.toBeFunction()
        });
      });
    });
    describe('API', () => {
      let api;
      beforeEach(() => {
        api = electron.contextBridge.exposeInMainWorld.mock.calls[0][1];
      });
      test.each([
        ['closeDialog', 'closeDialog'],
        ['settingsSave', 'settingsSave', {tabs: []}],
        ['settingsLoad', 'settingsLoad'],
        ['settingsExport', 'settingsExport'],
        ['settingsImport', 'settingsImport'],
        ['settingsOpenFolder', 'settingsOpenFolder'],
        ['dictionaryGetAvailable', 'dictionaryGetAvailable'],
        ['dictionaryGetAvailableNative', 'dictionaryGetAvailableNative'],
        ['dictionaryGetEnabled', 'dictionaryGetEnabled']
      ])('%s invokes %s via %s', (apiMethod, event, ...args) => {
        const eventHandler = jest.fn();
        electron.ipcMain.handle(event, eventHandler);
        api[apiMethod](...args);
        expect(eventHandler).toHaveBeenCalledWith(...args);
      });
    });
  });
  describe('preload.bundle', () => {
    beforeEach(() => {
      require('../../../bundles/settings.preload');
    });
    test('creates an API', () => {
      expect(electron.contextBridge.exposeInMainWorld).toHaveBeenCalledWith('electron', {
        closeDialog: expect.toBeFunction(),
        settingsSave: expect.toBeFunction(),
        settingsLoad: expect.toBeFunction(),
        settingsExport: expect.toBeFunction(),
        settingsImport: expect.toBeFunction(),
        settingsOpenFolder: expect.toBeFunction(),
        dictionaryGetAvailable: expect.toBeFunction(),
        dictionaryGetAvailableNative: expect.toBeFunction(),
        dictionaryGetEnabled: expect.toBeFunction()
      });
    });
  });
});
