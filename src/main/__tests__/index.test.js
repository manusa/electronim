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
describe('Main module test suite', () => {
  let mockNotification;
  let electron;
  let mockView;
  let mockBaseWindow;
  let mockDesktopCapturer;
  let mockIpc;
  let mockNativeTheme;
  let mockSettings;
  let appMenuModule;
  let settingsModule;
  let tabManagerModule;
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
    mockView = electron.webContentsViewInstance;
    mockBaseWindow = electron.baseWindowInstance;
    mockIpc = electron.ipcMain;
    appMenuModule = require('../../app-menu');
    jest.spyOn(appMenuModule, 'newAppMenu');
    settingsModule = require('../../settings');
    jest.spyOn(settingsModule, 'getPlatform').mockImplementation(() => 'linux');
    jest.spyOn(settingsModule, 'loadSettings').mockImplementation(() => mockSettings);
    jest.spyOn(settingsModule, 'updateSettings').mockImplementation();
    tabManagerModule = require('../../tab-manager');
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
  describe('initTabListener ipc events', () => {
    describe('tabsReady', () => {
      let addTabsNested;
      beforeEach(() => {
        addTabsNested = jest.fn();
        jest.spyOn(tabManagerModule, 'addTabs')
          .mockImplementation(() => addTabsNested);
      });
      test('No tabs in settings, should open settings dialog', () => {
        // Given
        settingsModule.loadSettings.mockImplementation(() => ({tabs: []}));
        main.init();
        // When
        mockIpc.listeners.tabsReady({});
        // Then
        expect(tabManagerModule.addTabs).not.toHaveBeenCalled();
        expect(addTabsNested).not.toHaveBeenCalled();
        expect(mockView.webContents.loadURL)
          .toHaveBeenCalledWith(expect.stringMatching(/settings\/index.html$/));
      });
      test('Previous saved tabs in loaded settings, should add tabs to manager and activate them as they are added', () => {
        // Given
        const event = {sender: {send: jest.fn()}};
        settingsModule.loadSettings.mockImplementation(() => ({tabs: [
          {id: '1337', otherInfo: 'A Tab'},
          {id: 'disabled-1337', disabled: true, otherInfo: 'I should be ignored'}
        ]}));
        main.init();
        // When
        mockIpc.listeners.tabsReady(event);
        // Then
        expect(tabManagerModule.addTabs).toHaveBeenCalledWith(event.sender);
        expect(addTabsNested).toHaveBeenCalledTimes(1);
        expect(addTabsNested).toHaveBeenCalledWith([{id: '1337', otherInfo: 'A Tab', active: false}]);
        expect(mockView.webContents.loadURL)
          .not.toHaveBeenCalledWith(expect.stringMatching(/settings\/index.html$/));
      });
    });
    describe('activateTab', () => {
      let activeTab;
      beforeEach(() => {
        activeTab = {
          setBounds: jest.fn(),
          webContents: {focus: jest.fn()}
        };
        mockBaseWindow.getBrowserViews = jest.fn(() => ([]));
        mockBaseWindow.setBrowserView = jest.fn();
        mockBaseWindow.addBrowserView = jest.fn();
        tabManagerModule.getTab = jest.fn(id => (id === 'validId' ? activeTab : null));
      });
      test('no active tab, should do nothing', () => {
        // Given
        main.init();
        // When
        mockIpc.listeners.activateTab({}, {id: 'not here'});
        // Then
        expect(mockBaseWindow.setBrowserView).not.toHaveBeenCalled();
        expect(mockBaseWindow.addBrowserView).not.toHaveBeenCalled();
      });
      test('active tab, should resize tab and set it as the main window browser view', () => {
        // Given
        mockBaseWindow.getContentBounds = jest.fn(() => ({width: 13, height: 83}));
        main.init();
        // When
        mockIpc.listeners.activateTab({}, {id: 'validId'});
        // Then
        expect(activeTab.setBounds).toHaveBeenCalledWith({x: 0, y: 46, width: 13, height: 37});
        expect(mockBaseWindow.contentView.addChildView)
          .toHaveBeenCalledWith(expect.objectContaining({isTabContainer: true}));
        expect(mockBaseWindow.contentView.addChildView).toHaveBeenCalledWith(activeTab);
        expect(activeTab.webContents.focus).toHaveBeenCalledTimes(1);
      });
      test('#23, setBounds should be called AFTER adding view to BaseWindow', () => {
        // Given
        mockBaseWindow.getContentBounds = jest.fn(() => ({width: 13, height: 83}));
        main.init();
        // When
        mockIpc.listeners.activateTab({}, {id: 'validId'});
        // Then
        expect(mockBaseWindow.contentView.addChildView).toHaveBeenCalledBefore(mockView.setBounds);
        expect(mockBaseWindow.contentView.addChildView).toHaveBeenCalledBefore(mockView.setBounds);
        expect(mockBaseWindow.contentView.addChildView).toHaveBeenCalledBefore(activeTab.setBounds);
        expect(mockBaseWindow.contentView.addChildView).toHaveBeenCalledBefore(activeTab.setBounds);
      });
    });
    test('canNotify, should call to the canNotify method of the tabManager', () => {
      // Given
      const mockIpcMainEvent = {returnValue: null};
      tabManagerModule.canNotify = jest.fn(() => 'yepe');
      main.init();
      // When
      mockIpc.listeners.canNotify(mockIpcMainEvent, 'validId');
      // Then
      expect(tabManagerModule.canNotify).toHaveBeenCalledWith('validId');
      expect(mockIpcMainEvent.returnValue).toBe('yepe');
    });
    test('notificationClick, should restore window and activate tab', () => {
      // Given
      mockSettings.startMinimized = true;
      mockBaseWindow.restore = jest.fn();
      mockBaseWindow.show = jest.fn();
      jest.spyOn(tabManagerModule, 'getTab').mockImplementation();
      main.init();
      // When
      mockIpc.listeners.notificationClick({}, {tabId: 'validId'});
      // Then
      expect(mockView.webContents.send).toHaveBeenCalledWith('activateTabInContainer', {tabId: 'validId'});
      expect(mockBaseWindow.restore).toHaveBeenCalledTimes(1);
      expect(mockBaseWindow.show).toHaveBeenCalledTimes(1);
      expect(mockBaseWindow.show).toHaveBeenCalledAfter(mockBaseWindow.restore);
      expect(tabManagerModule.getTab).toHaveBeenCalledWith('validId');
    });
    test('handleReload', () => {
      const event = {sender: {reloadIgnoringCache: jest.fn()}};
      main.init();
      // When
      mockIpc.listeners.reload(event);
      // Then
      expect(event.sender.reloadIgnoringCache).toHaveBeenCalledTimes(1);
    });
    test('handleZoomIn', () => {
      const event = {sender: {
        getZoomFactor: jest.fn(() => 0),
        setZoomFactor: jest.fn()
      }};
      main.init();
      // When
      mockIpc.listeners.zoomIn(event);
      // Then
      expect(event.sender.setZoomFactor).toHaveBeenCalledTimes(1);
      expect(event.sender.setZoomFactor).toHaveBeenCalledWith(0.1);
    });
    describe('handleZoomOut', () => {
      test('with valid initial zoom factor, should zoom out', () => {
        const event = {sender: {
          getZoomFactor: jest.fn(() => 0.200001),
          setZoomFactor: jest.fn()
        }};
        main.init();
        // When
        mockIpc.listeners.zoomOut(event);
        // Then
        expect(event.sender.setZoomFactor).toHaveBeenCalledTimes(1);
        expect(event.sender.setZoomFactor).toHaveBeenCalledWith(0.100001);
      });
      test('with invalid initial zoom factor, should do nothing', () => {
        const event = {sender: {
          getZoomFactor: jest.fn(() => 0.199999999999999),
          setZoomFactor: jest.fn()
        }};
        main.init();
        // When
        mockIpc.listeners.zoomOut(event);
        // Then
        expect(event.sender.setZoomFactor).not.toHaveBeenCalled();
      });
    });
    test('handleZoomReset', () => {
      const event = {sender: {setZoomFactor: jest.fn()}};
      main.init();
      // When
      mockIpc.listeners.zoomReset(event);
      // Then
      expect(event.sender.setZoomFactor).toHaveBeenCalledTimes(1);
      expect(event.sender.setZoomFactor).toHaveBeenCalledWith(1);
    });
    describe('handleTabReorder', () => {
      test('Several tabs, order changed, should update settings', () => {
        // Given
        mockSettings = {
          tabs: [{id: '1337'}, {id: '313373'}]
        };
        main.init();
        // When
        mockIpc.listeners.tabReorder({}, {tabIds: ['313373', '1337']});
        // Then
        expect(settingsModule.updateSettings).toHaveBeenCalledWith({tabs: [{id: '313373'}, {id: '1337'}]});
      });
      test('Several tabs, order changed, should update tabManager order', () => {
        // Given
        mockSettings = {
          tabs: [{id: '1337'}, {id: '313373'}]
        };
        jest.spyOn(tabManagerModule, 'sortTabs').mockImplementation();
        main.init();
        // When
        mockIpc.listeners.tabReorder({}, {tabIds: ['313373', '1337']});
        // Then
        expect(tabManagerModule.sortTabs).toHaveBeenCalledWith(['313373', '1337']);
      });
      test('Several tabs with hidden, order changed, should update settings keeping hidden tags', () => {
        // Given
        mockSettings = {
          tabs: [{id: '1337'}, {id: 'hidden'}, {id: '313373'}, {id: 'hidden-too'}]
        };
        main.init();
        // When
        mockIpc.listeners.tabReorder({}, {tabIds: ['313373', '1337']});
        // Then
        expect(settingsModule.updateSettings).toHaveBeenCalledWith({tabs: [
          {id: '313373'}, {id: '1337'}, {id: 'hidden'}, {id: 'hidden-too'}
        ]});
      });
    });
  });
});
