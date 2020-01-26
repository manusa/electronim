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
  let mockSettings;
  let mockSpellCheck;
  beforeEach(() => {
    mockSpellCheck = {
      AVAILABLE_DICTIONARIES: 'someAvailableDictionaries', getEnabledDictionaries: jest.fn(() => '1337')
    };
    mockSettings = {loadSettings: jest.fn(() => ({tabs: ['1337']}))};
    jest.resetModules();
    jest.mock('../../main/preload', () => {
      global.mainPreloadLoaded = true;
    });
    jest.mock('../../spell-check', () => mockSpellCheck);
    jest.mock('../', () => mockSettings);
  });
  test('preload', () => {
    // Given
    // When
    require('../preload');
    // Then
    expect(global.mainPreloadLoaded).toBe(true);
    expect(window.dictionaries.available).toBe(mockSpellCheck.AVAILABLE_DICTIONARIES);
    expect(mockSpellCheck.getEnabledDictionaries).toHaveBeenCalledTimes(1);
    expect(window.dictionaries.enabled).toBe('1337');
    expect(mockSettings.loadSettings).toHaveBeenCalledTimes(1);
    expect(window.tabs).toEqual(['1337']);
  });
});
