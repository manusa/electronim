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
  let mockNotification;
  let electron;
  let mockBaseWindow;
  let mockDesktopCapturer;
  let mockIpc;
  let mockNativeTheme;
  let mockSettings;
  let appMenuModule;
  let settingsModule;
  let main;
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers({doNotFake: ['setInterval']});
    mockNotification = jest.fn();
    mockDesktopCapturer = {};
    mockNativeTheme = {};
    mockSettings = {};
    jest.mock('electron', () => require('../../__tests__').mockElectronInstance({
      Notification: jest.fn(() => mockNotification),
      desktopCapturer: mockDesktopCapturer,
      nativeTheme: mockNativeTheme
    }));
    electron = require('electron');
    mockBaseWindow = electron.baseWindowInstance;
    // Each view should be a separate instance
    electron.WebContentsView = jest.fn(() => require('../../__tests__').mockWebContentsViewInstance());
    mockIpc = electron.ipcMain;
    appMenuModule = require('../../app-menu');
    jest.spyOn(appMenuModule, 'newAppMenu');
    settingsModule = require('../../settings');
    jest.spyOn(settingsModule, 'getPlatform').mockImplementation(() => 'linux');
    jest.spyOn(settingsModule, 'loadSettings').mockImplementation(() => mockSettings);
    jest.spyOn(settingsModule, 'updateSettings').mockImplementation();
    jest.spyOn(require('../../user-agent'), 'initBrowserVersions').mockImplementation(() => ({
      then: func => {
        func.call();
        return {catch: () => {}};
      }
    }));
    main = require('../');
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  describe('init - environment preparation', () => {
    describe('theme', () => {
      test.each(['dark', 'light', 'system'])('uses theme from saved settings (%s)', theme => {
        // Given
        mockSettings.theme = theme;
        // When
        main.init();
        jest.runAllTimers();
        // Then
        expect(mockNativeTheme.themeSource).toBe(theme);
      });
    });
    describe('icon', () => {
      test('uses icon.png', () => {
        // When
        main.init();
        // Then
        expect(electron.BaseWindow).toHaveBeenCalledWith(expect.objectContaining({
          icon: expect.stringMatching(/icon\.png$/)
        }));
      });
      test('in windows, uses icon.ico', () => {
        // Given
        settingsModule.getPlatform.mockImplementation(() => 'win32');
        // When
        main.init();
        // Then
        expect(electron.BaseWindow).toHaveBeenCalledWith(expect.objectContaining({
          icon: expect.stringMatching(/icon\.ico$/)
        }));
      });
    });
    describe('startMinimized', () => {
      test('Main window should always start not shown', () => {
        // When
        main.init();
        // Then
        expect(electron.BaseWindow).toHaveBeenCalledWith(expect.objectContaining({
          show: false, paintWhenInitiallyHidden: false
        }));
      });
      describe('=true', () => {
        beforeEach(() => {
          mockSettings.startMinimized = true;
          main.init();
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
        beforeEach(() => {
          mockSettings.startMinimized = false;
          main.init();
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
    test('fixUserDataLocation, should set a location in lower-case (Electron <14 compatible)', () => {
      // Given
      electron.app.getPath.mockImplementation(() => 'ImMixed-Case/WithSome\\Separator$');
      // When
      main.init();
      expect(electron.app.setPath).toHaveBeenCalledWith('userData', 'immixed-case/withsome\\separator$');
    });
    test('initDesktopCapturerHandler, should register desktopCapturer', () => {
      // Given
      const opts = {the: 'opts'};
      mockDesktopCapturer.getSources = jest.fn();
      mockIpc.handle.mockImplementation((_channel, listener) => {
        listener.call(null, {}, opts);
      });
      // When
      main.init();
      // Then
      expect(mockIpc.handle).toHaveBeenCalledWith('desktopCapturerGetSources', expect.any(Function));
      expect(mockDesktopCapturer.getSources).toHaveBeenCalledWith(opts);
    });
  });
  describe('mainWindow events', () => {
    let views;
    beforeEach(() => {
      jest.spyOn(global, 'setTimeout');
      views = [];
      mockBaseWindow.getSize = jest.fn(() => ([13, 37]));
      mockBaseWindow.getContentBounds = jest.fn(() => ({x: 0, y: 0, width: 10, height: 34}));
      mockBaseWindow.contentView.children = views;
      main.init();
    });
    describe('maximize', () => {
      test('single view, should set View to fit window', () => {
        // Given
        const singleView = {
          getBounds: jest.fn(() => ({x: 0, y: 0, width: 1, height: 1})),
          setBounds: jest.fn()
        };
        views.push(singleView);
        // When
        mockBaseWindow.listeners.maximize({sender: mockBaseWindow});
        jest.runAllTimers();
        // Then
        expect(singleView.setBounds).toHaveBeenCalledWith({x: 0, y: 0, width: 10, height: 34});
      });
      test('should store new size in configuration file', () => {
        // When
        mockBaseWindow.listeners.maximize({sender: mockBaseWindow});
        jest.runAllTimers();
        // Then
        expect(settingsModule.updateSettings).toHaveBeenCalledWith({width: 13, height: 37});
      });
    });
    describe('restore (required for windows when starting minimized)', () => {
      let mockAppMenu;
      beforeEach(() => {
        mockAppMenu = new electron.WebContentsView();
        mockAppMenu.isAppMenu = true;
        jest.spyOn(appMenuModule, 'newAppMenu').mockImplementation(() => mockAppMenu);
        main.init();
      });
      test('should set app-menu bounds', () => {
        // When
        mockBaseWindow.listeners.restore({sender: mockBaseWindow});
        jest.runAllTimers();
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
      test('#78: should be run in separate setTimeout timer function to resize properly in Linux (timers)', () => {
        // When
        mockBaseWindow.listeners.resize({sender: mockBaseWindow});
        jest.runAllTimers();
        // Then
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(mockBaseWindow.getContentBounds).toHaveBeenCalledTimes(1);
      });
      test('should store new size in configuration file', () => {
        // When
        mockBaseWindow.listeners.resize({sender: mockBaseWindow});
        jest.runAllTimers();
        // Then
        expect(settingsModule.updateSettings).toHaveBeenCalledWith({width: 13, height: 37});
      });
      describe('app-menu', () => {
        let mockAppMenu;
        beforeEach(() => {
          mockAppMenu = new electron.WebContentsView();
          mockAppMenu.isAppMenu = true;
          jest.spyOn(appMenuModule, 'newAppMenu').mockImplementation(() => mockAppMenu);
          main.init();
        });
        test('should set app-menu bounds', () => {
          // When
          mockBaseWindow.listeners.resize({sender: mockBaseWindow});
          jest.runAllTimers();
          // Then
          expect(mockAppMenu.setBounds).toHaveBeenCalledWith({x: 0, y: 0, width: 10, height: 34});
        });
        test('should ignore if undefined (app might be resized before app-menu is initialized)', () => {
          // Given
          mockAppMenu.setBounds = null;
          // When
          mockBaseWindow.listeners.resize({sender: mockBaseWindow});
          jest.runAllTimers();
          // Then
          expect(mockBaseWindow.setBounds).not.toHaveBeenCalled();
        });
      });
      test('find-in-page, should set specific dialog bounds', () => {
        // Given
        main.init();
        mockIpc.listeners.findInPageOpen();
        const findInPageDialog = mockBaseWindow.contentView.children.find(cv => cv.isFindInPage);
        // When
        mockBaseWindow.listeners.resize({sender: mockBaseWindow});
        jest.runAllTimers();
        // Then
        expect(findInPageDialog.setBounds).toHaveBeenCalledWith({x: -390, y: 0, width: 400, height: 60});
      });
      test('single view, should set View to fit window', () => {
        // Given
        const singleView = {
          getBounds: jest.fn(() => ({x: 0, y: 0, width: 1, height: 1})),
          setBounds: jest.fn()
        };
        views.push(singleView);
        // When
        mockBaseWindow.listeners.resize({sender: mockBaseWindow});
        jest.runAllTimers();
        // Then
        expect(singleView.setBounds).toHaveBeenCalledWith({x: 0, y: 0, width: 10, height: 34});
      });
      test('multiple views, should set last View to fit window and store new size in configuration file', () => {
        // Given
        const topBar = {
          getBounds: jest.fn(() => ({x: 0, y: 0, width: 1, height: 1})),
          setBounds: jest.fn()
        };
        const content = {
          getBounds: jest.fn(() => ({x: 1337, y: 1337, width: 1, height: 1})),
          setBounds: jest.fn()
        };
        views.push(topBar, content);
        // When
        mockBaseWindow.listeners.resize({sender: mockBaseWindow});
        jest.runAllTimers();
        // Then
        expect(settingsModule.updateSettings).toHaveBeenCalledWith({width: 13, height: 37});
        expect(topBar.setBounds).toHaveBeenCalledWith({x: 0, y: 0, width: 10, height: 1});
        expect(content.setBounds).toHaveBeenCalledWith({x: 1337, y: 1337, width: 10, height: 33});
      });
    });
  });
});
