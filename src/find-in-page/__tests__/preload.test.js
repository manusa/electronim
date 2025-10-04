/*
   Copyright 2024 Marc Nuri San Felix

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
describe('Find in Page :: preload test suite', () => {
  let electron;
  beforeEach(() => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
  });
  describe('preload (just for coverage and sanity, see bundle tests)', () => {
    beforeEach(() => {
      global.APP_EVENTS = require('../../constants').APP_EVENTS;
      require('../preload');
    });
    test('creates an API', () => {
      expect(electron.contextBridge.exposeInMainWorld).toHaveBeenCalledWith('electron', {
        close: expect.toBeFunction(),
        findInPage: expect.toBeFunction(),
        onFindInPage: expect.toBeFunction()
      });
    });
    describe('API', () => {
      let api;
      beforeEach(() => {
        api = electron.contextBridge.exposeInMainWorld.mock.calls[0][1];
      });
      test.each([
        ['close', 'findInPageClose']
      ])('%s invokes %s', (apiMethod, event) => {
        api[apiMethod]();
        expect(electron.ipcRenderer.send).toHaveBeenCalledWith(event);
      });
      test('findInPage invokes findInPage', () => {
        api.findInPage('test');
        expect(electron.ipcRenderer.send).toHaveBeenCalledWith('findInPage', 'test');
      });
      test('onFindInPage invokes onFindInPage to register callback', () => {
        const mockFunction = jest.fn();
        api.onFindInPage(mockFunction);
        expect(electron.ipcRenderer.on).toHaveBeenCalledWith('findInPageFound', mockFunction);
      });
    });
  });
  describe('preload.bundle', () => {
    beforeEach(() => {
      require('../../../bundles/find-in-page.preload');
    });
    test('creates an API', () => {
      expect(electron.contextBridge.exposeInMainWorld).toHaveBeenCalledWith('electron', {
        close: expect.toBeFunction(),
        findInPage: expect.toBeFunction(),
        onFindInPage: expect.toBeFunction()
      });
    });
  });
});
