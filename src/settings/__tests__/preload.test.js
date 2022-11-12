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
  beforeEach(() => {
    jest.resetModules();
    jest.mock('electron', () => require('../../__tests__').mockElectronInstance({
      ipcRenderer: 'the-ipc-renderer'
    }));
  });
  describe('preload (just for coverage and sanity, see bundle tests)', () => {
    beforeEach(() => {
      require('../preload');
    });
    test('adds required variables', () => {
      expect(window.ipcRenderer).toEqual('the-ipc-renderer');
    });
  });
  describe('preload.bundle', () => {
    beforeEach(() => {
      require('../../../bundles/settings.preload');
    });
    test('adds required variables', () => {
      expect(window.ipcRenderer).toEqual('the-ipc-renderer');
    });
  });
});
