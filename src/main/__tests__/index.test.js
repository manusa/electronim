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
  let mockBaseWindow;
  let appMenuModule;
  let main;

  const waitForTrayInit = async initFn => {
    const trayInitPromise = new Promise(resolve => electron.ipcMain.on('trayInit', resolve));
    initFn();
    return trayInitPromise;
  };

  beforeEach(async () => {
    jest.resetModules();
    electron = await require('../../__tests__').testElectron();
    mockBaseWindow = electron.baseWindowInstance;
    // Each view should be a separate instance
    electron.WebContentsView = jest.fn(() => require('../../__tests__').mockWebContentsViewInstance());
    settings = await require('../../__tests__').testSettings();
    jest.spyOn(settings, 'getPlatform').mockImplementation(() => 'linux');
    await require('../../__tests__').testUserAgent();
    appMenuModule = require('../../app-menu');
    jest.spyOn(appMenuModule, 'newAppMenu');
    main = require('../');
  });
  describe('init - environment preparation', () => {
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
        beforeEach(async () => {
          settings.updateSettings({startMinimized: true});
          await waitForTrayInit(main.init);
        });
        test('should call showInactive', () => {
          expect(mockBaseWindow.showInactive).toHaveBeenCalledTimes(1);
        });
        test('should call minimize after showInactive', () => {
          expect(mockBaseWindow.minimize).toHaveBeenCalledAfter(mockBaseWindow.showInactive);
        });
        test('should not call show', () => {
          expect(mockBaseWindow.show).not.toHaveBeenCalled();
        });
      });
      describe('=false', () => {
        beforeEach(async () => {
          settings.updateSettings({startMinimized: false});
          await waitForTrayInit(main.init);
        });
        test('should call show', () => {
          expect(mockBaseWindow.show).toHaveBeenCalledTimes(1);
        });
        test('should not call showInactive', () => {
          expect(mockBaseWindow.showInactive).not.toHaveBeenCalled();
        });
        test('should not call minimize', () => {
          expect(mockBaseWindow.minimize).not.toHaveBeenCalled();
        });
      });
    });
    test('fixUserDataLocation, should set a location in lower-case (Electron <14 compatible)', async () => {
      // Given
      electron.app.getPath.mockImplementation(() => 'ImMixed-Case/WithSome\\Separator$');
      // When
      await waitForTrayInit(main.init);
      // Then
      expect(electron.app.setPath).toHaveBeenCalledWith('userData', 'immixed-case/withsome\\separator$');
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
  describe('mainWindow events', () => {
    let views;
    let mockBaseWindowGetContentBounds;

    beforeEach(async () => {
      jest.spyOn(global, 'setTimeout');
      views = [];
      mockBaseWindow.getSize = jest.fn(() => ([13, 37]));
      mockBaseWindowGetContentBounds = new Promise(resolve => {
        mockBaseWindow.getContentBounds = jest.fn(() => {
          resolve();
          return ({x: 0, y: 0, width: 10, height: 34});
        });
      });
      mockBaseWindow.contentView.children = views;
      await waitForTrayInit(main.init);
    });
    describe('maximize', () => {
      test('single view, should set View to fit window', async () => {
        // Given
        const singleView = {
          getBounds: jest.fn(() => ({x: 0, y: 0, width: 1, height: 1}))
        };
        const setBoundsPromise = new Promise(resolve => {
          singleView.setBounds = jest.fn(resolve);
        });
        views.push(singleView);
        // When
        mockBaseWindow.listeners.maximize({sender: mockBaseWindow});
        await setBoundsPromise;
        // Then
        expect(singleView.setBounds).toHaveBeenCalledWith({x: 0, y: 0, width: 10, height: 34});
      });
      test('should store new size in configuration file', () => {
        // When
        mockBaseWindow.listeners.maximize({sender: mockBaseWindow});
        // Then
        expect(settings.loadSettings()).toEqual(expect.objectContaining({width: 13, height: 37}));
      });
    });
    describe('restore (required for windows when starting minimized)', () => {
      let mockAppMenu;
      beforeEach(async () => {
        mockAppMenu = new electron.WebContentsView();
        mockAppMenu.isAppMenu = true;
        jest.spyOn(appMenuModule, 'newAppMenu').mockImplementation(() => mockAppMenu);
        await waitForTrayInit(main.init);
      });
      test('should set app-menu bounds', async () => {
        const setBoundsPromise = new Promise(resolve => {
          mockAppMenu.setBounds = jest.fn(resolve);
        });
        // When
        mockBaseWindow.listeners.restore({sender: mockBaseWindow});
        await setBoundsPromise;
        // Then
        expect(mockAppMenu.setBounds).toHaveBeenCalledWith({x: 0, y: 0, width: 10, height: 34});
      });
    });
    describe('resize', () => {
      test('#78: should be run in separate setTimeout timer function to resize properly in Linux (no timers)', () => {
        // When
        mockBaseWindow.listeners.resize({sender: mockBaseWindow});
        // Then
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(mockBaseWindow.getContentBounds).not.toHaveBeenCalled();
      });
      test('#78: should be run in separate setTimeout timer function to resize properly in Linux (timers)', async () => {
        // When
        mockBaseWindow.listeners.resize({sender: mockBaseWindow});
        await mockBaseWindowGetContentBounds;
        // Then
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(mockBaseWindow.getContentBounds).toHaveBeenCalledTimes(1);
      });
      test('should store new size in configuration file', () => {
        // When
        mockBaseWindow.listeners.resize({sender: mockBaseWindow});
        // Then
        expect(settings.loadSettings()).toEqual(expect.objectContaining({width: 13, height: 37}));
      });
      describe('app-menu', () => {
        let mockAppMenu;
        beforeEach(async () => {
          mockAppMenu = new electron.WebContentsView();
          mockAppMenu.isAppMenu = true;
          jest.spyOn(appMenuModule, 'newAppMenu').mockImplementation(() => mockAppMenu);
          await waitForTrayInit(main.init);
        });
        test('should set app-menu bounds', async () => {
          // Given
          const setBoundsPromise = new Promise(resolve => {
            mockAppMenu.setBounds = jest.fn(resolve);
          });
          // When
          mockBaseWindow.listeners.resize({sender: mockBaseWindow});
          await setBoundsPromise;
          // Then
          expect(mockAppMenu.setBounds).toHaveBeenCalledWith({x: 0, y: 0, width: 10, height: 34});
        });
        test('should ignore if undefined (app might be resized before app-menu is initialized)', () => {
          // Given
          mockAppMenu.setBounds = null;
          // When
          mockBaseWindow.listeners.resize({sender: mockBaseWindow});
          // Then
          expect(mockBaseWindow.setBounds).not.toHaveBeenCalled();
        });
      });
      test('find-in-page, should set specific dialog bounds', () => {
        // Given
        main.init();
        electron.ipcMain.listeners.findInPageOpen();
        const findInPageDialog = mockBaseWindow.contentView.children.find(cv => cv.isFindInPage);
        // When
        mockBaseWindow.listeners.resize({sender: mockBaseWindow});
        // Then
        expect(findInPageDialog.setBounds).toHaveBeenCalledWith({x: -390, y: 0, width: 400, height: 60});
      });
      test('single view, should set View to fit window', async () => {
        // Given
        const singleView = {
          getBounds: jest.fn(() => ({x: 0, y: 0, width: 1, height: 1}))
        };
        const setBoundsPromise = new Promise(resolve => {
          singleView.setBounds = jest.fn(resolve);
        });
        views.push(singleView);
        // When
        mockBaseWindow.listeners.resize({sender: mockBaseWindow});
        await setBoundsPromise;
        // Then
        expect(singleView.setBounds).toHaveBeenCalledWith({x: 0, y: 0, width: 10, height: 34});
      });
      test('multiple views, should set last View to fit window and store new size in configuration file', async () => {
        // Given
        const topBar = {
          getBounds: jest.fn(() => ({x: 0, y: 0, width: 1, height: 1})),
          setBounds: jest.fn()
        };
        const content = {
          getBounds: jest.fn(() => ({x: 1337, y: 1337, width: 1, height: 1}))
        };
        const setBoundsPromise = new Promise(resolve => {
          content.setBounds = jest.fn(resolve);
        });
        views.push(topBar, content);
        // When
        mockBaseWindow.listeners.resize({sender: mockBaseWindow});
        await setBoundsPromise;
        // Then
        expect(settings.loadSettings()).toEqual(expect.objectContaining({width: 13, height: 37}));
        expect(topBar.setBounds).toHaveBeenCalledWith({x: 0, y: 0, width: 10, height: 1});
        expect(content.setBounds).toHaveBeenCalledWith({x: 1337, y: 1337, width: 10, height: 33});
      });
    });
  });
});
