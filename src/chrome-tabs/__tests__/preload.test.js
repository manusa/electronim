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
describe('Chrome Tabs Module preload test suite', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.mock('electron', () => ({
      ipcRenderer: {send: jest.fn()}
    }));
  });
  describe('preload (just for coverage and sanity, see bundle tests)', () => {
    beforeEach(() => {
      window.APP_EVENTS = {};
      window.ELECTRONIM_VERSION = '1.33.7';
      require('../preload');
    });
    test('adds required libraries', () => {
      expect(window.ipcRenderer.send).toBeDefined();
    });
  });
  describe('preload.bundle', () => {
    beforeEach(() => {
      require('../../../bundles/chrome-tabs.preload');
    });
    test('adds required variables', async () => {
      expect(window.ipcRenderer.send).toBeDefined();
    });
  });
});
