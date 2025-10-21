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
    require('../../__tests__').testElectron();
    globalThis.APP_EVENTS = require('../../constants').APP_EVENTS;
  });
  describe('preload (just for coverage and sanity, see bundle tests)', () => {
    beforeEach(() => {
      require('../preload');
    });
    describe('creates an API', () => {
      test('appMenuOpen', () => {
        expect(globalThis.electron.appMenuOpen).toBeDefined();
      });
      test('servicesReady', () => {
        expect(globalThis.electron.servicesReady).toBeDefined();
      });
      test('activateService', () => {
        expect(globalThis.electron.activateService).toBeDefined();
      });
      test('servicesReorder', () => {
        expect(globalThis.electron.servicesReorder).toBeDefined();
      });
      test('onAddServices', () => {
        expect(globalThis.electron.onAddServices).toBeDefined();
      });
      test('onActivateServiceInContainer', () => {
        expect(globalThis.electron.onActivateServiceInContainer).toBeDefined();
      });
      test('onElectronimNewVersionAvailable', () => {
        expect(globalThis.electron.onElectronimNewVersionAvailable).toBeDefined();
      });
      test('onSetServiceDisableNotifications', () => {
        expect(globalThis.electron.onSetServiceDisableNotifications).toBeDefined();
      });
      test('onSetServiceFavicon', () => {
        expect(globalThis.electron.onSetServiceFavicon).toBeDefined();
      });
      test('onSetServiceTitle', () => {
        expect(globalThis.electron.onSetServiceTitle).toBeDefined();
      });
    });
  });
  describe('preload.bundle', () => {
    beforeEach(() => {
      require('../../../bundles/chrome-tabs.preload');
    });
    test('creates electron API', async () => {
      expect(globalThis.electron).toBeDefined();
      expect(globalThis.electron.appMenuOpen).toBeDefined();
      expect(globalThis.electron.servicesReady).toBeDefined();
    });
  });
});
