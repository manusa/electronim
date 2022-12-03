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
describe('Tray module test suite', () => {
  let mockSettings;
  let electron;
  let tray;
  beforeEach(() => {
    jest.spyOn(require('../../settings'), 'loadSettings').mockImplementation(() => mockSettings);
    jest.mock('electron', () => require('../../__tests__').mockElectronInstance());
    electron = require('electron');
    tray = require('../');
  });
  describe('initTray', () => {
    test('does nothing if tray is disabled', () => {
      // Given
      mockSettings = {trayEnabled: false};
      // When
      tray.initTray();
      // Then
      expect(electron.Tray).toHaveBeenCalledTimes(0);
    });
    test('instantiates tray if tray is enabled', () => {
      // Given
      mockSettings = {trayEnabled: true};
      // When
      tray.initTray();
      // Then
      expect(electron.Tray).toHaveBeenCalledTimes(1);
    });
    test('destroy previous tray', () => {
      // Given
      mockSettings = {trayEnabled: true};
      tray.initTray();
      electron.trayInstance.destroy.mockClear(); // previous tests might have already created a tray instance
      // When
      tray.initTray();
      // Then
      expect(electron.trayInstance.destroy).toHaveBeenCalledTimes(1);
    });
  });
});
