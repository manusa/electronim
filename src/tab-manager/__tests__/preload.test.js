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
describe('Tab Manager Module preload test suite', () => {
  let mockElectron;
  let mockKeyboardShortcuts;
  let mockSpellCheck;
  beforeEach(() => {
    mockElectron = {webFrame: 'somethingUnique'};
    mockKeyboardShortcuts = {initKeyboardShortcuts: jest.fn()};
    mockSpellCheck = {initSpellChecker: jest.fn()};
    jest.resetModules();
    jest.mock('../../main/preload', () => {
      global.mainPreloadLoaded = true;
    });
    jest.mock('electron', () => mockElectron);
    jest.mock('../browser-keyboard-shortcuts', () => mockKeyboardShortcuts);
    jest.mock('../browser-notification-shim', () => ({}));
    jest.mock('../browser-spell-check', () => mockSpellCheck);
  });
  test('preload', () => {
    // Given
    // When
    require('../preload');
    // Then
    expect(global.mainPreloadLoaded).toBe(true);
    expect(mockKeyboardShortcuts.initKeyboardShortcuts).toHaveBeenCalledTimes(1);
    expect(mockSpellCheck.initSpellChecker).toHaveBeenCalledTimes(1);
    expect(mockSpellCheck.initSpellChecker).toHaveBeenCalledWith(mockElectron.webFrame);
  });
});
