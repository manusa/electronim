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
const path = require('node:path');

describe('Tray module test suite', () => {
  let electron;
  let settings;
  let tray;
  beforeEach(async () => {
    electron = require('../../__tests__').testElectron();
    settings = await require('../../__tests__').testSettings();
    jest.spyOn(settings, 'getPlatform');
    tray = require('../');
  });
  afterEach(async () => {
    jest.resetModules();
  });
  describe('initTray', () => {
    describe.each([
      {platform: 'linux', expectedIcon: 'icon.png'},
      {platform: 'darwin', expectedIcon: 'iconTemplate.png'},
      {platform: 'win32', expectedIcon: 'icon.ico'},
      {platform: 'other', expectedIcon: 'icon.ico'}
    ])('in platform $platform', ({platform, expectedIcon}) => {
      beforeEach(() => {
        settings.getPlatform.mockImplementation(() => platform);
      });
      test('does nothing if tray is disabled', () => {
        // Given
        settings.updateSettings({trayEnabled: false});
        // When
        tray.initTray();
        // Then
        expect(electron.Tray).toHaveBeenCalledTimes(0);
      });
      test('instantiates tray if tray is enabled', () => {
        // Given
        settings.updateSettings({trayEnabled: true});
        // When
        tray.initTray();
        // Then
        expect(electron.Tray).toHaveBeenCalledTimes(1);
      });
      test('destroy previous tray', () => {
        // Given
        settings.updateSettings({trayEnabled: true});
        tray.initTray();
        electron.trayInstance.destroy.mockClear(); // previous tests might have already created a tray instance
        // When
        tray.initTray();
        // Then
        expect(electron.trayInstance.destroy).toHaveBeenCalledTimes(1);
      });
      test(`uses ${expectedIcon} icon`, () => {
        // Given
        settings.updateSettings({trayEnabled: true});
        // When
        tray.initTray();
        // Then
        expect(electron.Tray).toHaveBeenCalledWith(path.resolve(__dirname, '..', '..', 'assets', expectedIcon));
      });
    });
  });
});
