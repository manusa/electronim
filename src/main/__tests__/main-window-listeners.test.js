/**
 * @jest-environment node
 */
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
describe('Main :: Main window listeners test suite', () => {
  let electron;
  let baseWindow;
  let settings;
  beforeEach(async () => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    baseWindow = electron.baseWindowInstance;
    settings = await require('../../__tests__').testSettings();
    await require('../../__tests__').testUserAgent();
    const trayInitPromise = new Promise(resolve => electron.ipcMain.on('trayInit', resolve));
    require('../').init();
    await trayInitPromise;
  });
  describe('close', () => {
    let event;
    beforeEach(() => {
      event = {preventDefault: jest.fn()};
    });
    test('always calls event.preventDefault', () => {
      // When
      baseWindow.listeners.close(event);
      // Then
      expect(event.preventDefault).toHaveBeenCalled();
    });
    test('with quit, should exit app', () => {
      // When
      baseWindow.listeners.close(event);
      // Then
      expect(electron.app.exit).toHaveBeenCalled();
      expect(baseWindow.minimize).not.toHaveBeenCalled();
    });
    test('with minimize, should minimize the window', () => {
      // Given
      settings.updateSettings({closeButtonBehavior: 'minimize'});
      // When
      baseWindow.listeners.close(event);
      // Then
      expect(electron.app.exit).not.toHaveBeenCalled();
      expect(baseWindow.minimize).toHaveBeenCalled();
    });
  });
});
