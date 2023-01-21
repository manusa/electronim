/*
   Copyright 2023 Marc Nuri San Felix

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
describe('Main :: Quit test suite', () => {
  let electron;
  let quit;
  beforeEach(() => {
    jest.resetModules();
    jest.mock('electron', () => require('../../__tests__').mockElectronInstance());
    electron = require('electron');
    quit = require('../').quit;
  });
  describe('quit()', () => {
    beforeEach(() => {
      quit();
    });
    test('Clears cache', () => {
      expect(electron.session.defaultSession.clearCache).toHaveBeenCalled();
    });
    test('Clears code caches', () => {
      expect(electron.session.defaultSession.clearCodeCaches).toHaveBeenCalled();
    });
    test('Clears host resolver cache', () => {
      expect(electron.session.defaultSession.clearHostResolverCache).toHaveBeenCalled();
    });
    test('Clears storage data for service workers and cache storage', () => {
      expect(electron.session.defaultSession.clearStorageData)
        .toHaveBeenCalledWith({storages: ['serviceworkers', 'cachestorage']});
    });
  });
});
