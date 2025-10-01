/**
 * @jest-environment node
 */
/*
   Copyright 2024 Marc Nuri San Felix

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
describe('Main :: Tab listeners test suite', () => {
  let electron;
  let settings;
  let mockBaseWindow;
  let main;
  let mockIpc;
  let mockView;
  let tabManagerModule;
  beforeEach(async () => {
    jest.resetModules();
    settings = await require('../../__tests__').testSettings();
    jest.mock('electron', () => require('../../__tests__').mockElectronInstance());
    electron = require('electron');
    mockBaseWindow = electron.baseWindowInstance;
    mockIpc = electron.ipcMain;
    mockView = electron.webContentsViewInstance;
    tabManagerModule = require('../../tab-manager');
    jest.spyOn(require('../../user-agent'), 'initBrowserVersions').mockImplementation(() => ({
      then: func => {
        func.call();
        return {catch: () => {}};
      }
    }));
    main = require('../');
  });
  describe('tabsReady', () => {
    let addTabsNested;
    beforeEach(() => {
      addTabsNested = jest.fn();
      jest.spyOn(tabManagerModule, 'addTabs')
        .mockImplementation(() => addTabsNested);
    });
    test('No tabs in settings, should open settings dialog', () => {
      // Given
      settings.updateSettings({tabs: []});
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
      settings.updateSettings({
        tabs: [
          {id: '1337', otherInfo: 'A Tab'},
          {id: 'disabled-1337', disabled: true, otherInfo: 'I should be ignored'}
        ],
        activeTab: 'non-existent'
      });
      main.init();
      // When
      mockIpc.listeners.tabsReady(event);
      // Then
      expect(tabManagerModule.addTabs).toHaveBeenCalledWith(event.sender);
      expect(addTabsNested).toHaveBeenCalledTimes(1);
      expect(addTabsNested).toHaveBeenCalledWith([{id: '1337', otherInfo: 'A Tab', active: true}]);
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
    settings.updateSettings({startMinimized: true});
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
      settings.updateSettings({tabs: [{id: '1337'}, {id: '313373'}]});
      main.init();
      // When
      mockIpc.listeners.tabReorder({}, {tabIds: ['313373', '1337']});
      // Then
      const updatedSettings = settings.loadSettings();
      expect(updatedSettings.tabs).toEqual([{id: '313373'}, {id: '1337'}]);
    });
    test('Several tabs, order changed, should update tabManager order', () => {
      // Given
      settings.updateSettings({tabs: [{id: '1337'}, {id: '313373'}]});
      jest.spyOn(tabManagerModule, 'sortTabs').mockImplementation();
      main.init();
      // When
      mockIpc.listeners.tabReorder({}, {tabIds: ['313373', '1337']});
      // Then
      expect(tabManagerModule.sortTabs).toHaveBeenCalledWith(['313373', '1337']);
    });
    test('Several tabs with hidden, order changed, should update settings keeping hidden tags', () => {
      // Given
      settings.updateSettings({tabs: [
        {id: '1337'}, {id: 'hidden'}, {id: '313373'}, {id: 'hidden-too'}
      ]});
      main.init();
      // When
      mockIpc.listeners.tabReorder({}, {tabIds: ['313373', '1337']});
      // Then
      const updatedSettings = settings.loadSettings();
      expect(updatedSettings.tabs).toEqual([
        {id: '313373'}, {id: '1337'}, {id: 'hidden'}, {id: 'hidden-too'}
      ]);
    });
  });
});
