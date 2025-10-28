/**
 * @jest-environment node
 */
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
describe('Main :: Index module test suite', () => {
  let electron;
  let settings;
  let main;

  const waitForTrayInit = async initFn => {
    const trayInitPromise = new Promise(resolve => electron.ipcMain.on('trayInit', resolve));
    initFn();
    return trayInitPromise;
  };

  beforeEach(async () => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    settings = await require('../../__tests__').testSettings();
    jest.spyOn(settings, 'getPlatform').mockImplementation(() => 'linux');
    await require('../../__tests__').testUserAgent();
    main = require('../');
  });
  describe('init - environment preparation', () => {
    describe('Sets app name', () => {
      test('default', async () => {
        // When
        await waitForTrayInit(main.init);
        // Then
        expect(electron.app.name).toBe('ElectronIM');
      });
      test('with custom application title', async () => {
        // Given
        settings.updateSettings({applicationTitle: 'MyCustomAppName'});
        // When
        await waitForTrayInit(main.init);
        // Then
        expect(electron.app.name).toBe('MyCustomAppName');
      });
    });
    describe('theme', () => {
      test.each(['dark', 'light', 'system'])('uses theme from saved settings (%s)', async theme => {
        // Given
        settings.updateSettings({theme});
        // When
        await waitForTrayInit(main.init);
        // Then
        expect(electron.nativeTheme.themeSource).toBe(theme);
      });
    });
    describe('icon', () => {
      test('uses icon.png', async () => {
        // When
        await waitForTrayInit(main.init);
        // Then
        expect(electron.BaseWindow).toHaveBeenCalledWith(expect.objectContaining({
          icon: expect.stringMatching(/icon\.png$/)
        }));
      });
      test('in windows, uses icon.ico', async () => {
        // Given
        settings.getPlatform.mockImplementation(() => 'win32');
        // When
        await waitForTrayInit(main.init);
        // Then
        expect(electron.BaseWindow).toHaveBeenCalledWith(expect.objectContaining({
          icon: expect.stringMatching(/icon\.ico$/)
        }));
      });
    });
    describe('startMinimized', () => {
      test('Main window should always start not shown', async () => {
        // When
        await waitForTrayInit(main.init);
        // Then
        expect(electron.BaseWindow).toHaveBeenCalledWith(expect.objectContaining({
          show: false, paintWhenInitiallyHidden: false
        }));
      });
      describe('=true', () => {
        let baseWindow;
        beforeEach(async () => {
          settings.updateSettings({startMinimized: true});
          await waitForTrayInit(main.init);
          baseWindow = electron.BaseWindow.getAllWindows()[0];
        });
        test('should call showInactive', () => {
          expect(baseWindow.showInactive).toHaveBeenCalledTimes(1);
        });
        test('should call minimize after showInactive', () => {
          expect(baseWindow.minimize).toHaveBeenCalledAfter(baseWindow.showInactive);
        });
        test('should not call show', () => {
          expect(baseWindow.show).not.toHaveBeenCalled();
        });
      });
      describe('=false', () => {
        let baseWindow;
        beforeEach(async () => {
          settings.updateSettings({startMinimized: false});
          await waitForTrayInit(main.init);
          baseWindow = electron.BaseWindow.getAllWindows()[0];
        });
        test('should call show', () => {
          expect(baseWindow.show).toHaveBeenCalledTimes(1);
        });
        test('should not call showInactive', () => {
          expect(baseWindow.showInactive).not.toHaveBeenCalled();
        });
        test('should not call minimize', () => {
          expect(baseWindow.minimize).not.toHaveBeenCalled();
        });
      });
    });
    test('fixUserDataLocation, should set a location in lower-case (Electron <14 compatible)', async () => {
      // Given
      electron.app.getPath.mockImplementation(() => String.raw`ImMixed-Case/WithSome\Separator$`);
      // When
      await waitForTrayInit(main.init);
      // Then
      expect(electron.app.setPath).toHaveBeenCalledWith('userData', String.raw`immixed-case/withsome\separator$`);
    });
    test('initDesktopCapturerHandler, should register desktopCapturer', async () => {
      // Given
      const onGetSources = new Promise(resolve => electron.ipcMain.on('desktopCapturerGetSources', resolve));
      await waitForTrayInit(main.init);
      electron.ipcMain.emit('desktopCapturerGetSources', 'desktopCapturerGetSourcesEvent', {the: 'opts'});
      // When
      await onGetSources;
      // Then
      expect(electron.desktopCapturer.getSources).toHaveBeenCalledWith({the: 'opts'});
    });
  });
});
