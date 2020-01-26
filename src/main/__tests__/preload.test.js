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
describe('Main Module preload test suite', () => {
  let mockElectron;
  let mockConstants;
  beforeEach(() => {
    mockElectron = {ipcRenderer: 'somethingUnique'};
    mockConstants = {APP_EVENTS: 'someUniqueObject'};
    jest.resetModules();
    jest.mock('electron', () => mockElectron);
    jest.mock('../../constants', () => mockConstants);
  });
  test('preload', () => {
    // Given
    // When
    require('../preload');
    // Then
    expect(window.ipcRenderer).toBe(mockElectron.ipcRenderer);
    expect(window.APP_EVENTS).toBe(mockConstants.APP_EVENTS);
  });
});
