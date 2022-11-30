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
    jest.mock('electron', () => require('../../__tests__').mockElectronInstance());
    electron = require('electron');
  });
  describe('preload (just for coverage and sanity, see bundle tests)', () => {
    beforeEach(() => {
      global.APP_EVENTS = require('../../constants').APP_EVENTS;
      require('../preload');
    });
    test('creates an API', () => {
      expect(electron.contextBridge.exposeInMainWorld).toHaveBeenCalledWith('electron', {
        aboutOpenDialog: expect.toBeFunction(),
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
        ['aboutOpenDialog', 'aboutOpenDialog'],
        ['close', 'appMenuClose'],
        ['helpOpenDialog', 'helpOpenDialog'],
        ['quit', 'quit'],
        ['settingsOpenDialog', 'settingsOpenDialog']
      ])('%s invokes %s', (apiMethod, event) => {
        api[apiMethod]();
        expect(electron.ipcRenderer.send).toHaveBeenCalledWith(event);
      });
    });
  });
  describe('preload.bundle', () => {
    beforeEach(() => {
      require('../../../bundles/app-menu.preload');
    });
    test('creates an API', () => {
      expect(electron.contextBridge.exposeInMainWorld).toHaveBeenCalledWith('electron', {
        aboutOpenDialog: expect.toBeFunction(),
        close: expect.toBeFunction(),
        helpOpenDialog: expect.toBeFunction(),
        quit: expect.toBeFunction(),
        settingsOpenDialog: expect.toBeFunction()
      });
    });
  });
});
