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
  let main;
  let mockIpc;
  let mockView;
  let serviceManagerModule;

  const waitForTrayInit = async initFn => {
    const trayInitPromise = new Promise(resolve => electron.ipcMain.on('trayInit', resolve));
    initFn();
    return trayInitPromise;
  };

  beforeEach(async () => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    await require('../../__tests__').testUserAgent();
    settings = await require('../../__tests__').testSettings();
    mockIpc = electron.ipcMain;
    mockView = electron.webContentsViewInstance;
    serviceManagerModule = require('../../service-manager');
    main = require('../');
  });
  describe('servicesReady', () => {
    let addServicesNested;
    beforeEach(() => {
      addServicesNested = jest.fn();
      jest.spyOn(serviceManagerModule, 'addServices')
        .mockImplementation(() => addServicesNested);
    });
    test('No services in settings, should open settings dialog', () => {
      // Given
      settings.updateSettings({tabs: []});
      main.init();
      // When
      mockIpc.send('servicesReady', {});
      // Then
      expect(serviceManagerModule.addServices).not.toHaveBeenCalled();
      expect(addServicesNested).not.toHaveBeenCalled();
      expect(mockView.webContents.loadURL)
        .toHaveBeenCalledWith(expect.stringMatching(/settings\/index.html$/));
    });
    test('Previous saved services in loaded settings, should add services to manager and mark first enabled service as active', () => {
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
      mockIpc.send('servicesReady', event);
      // Then
      expect(serviceManagerModule.addServices).toHaveBeenCalledWith(event.sender);
      expect(addServicesNested).toHaveBeenCalledTimes(1);
      expect(addServicesNested).toHaveBeenCalledWith([{id: '1337', otherInfo: 'A Tab', active: true}]);
      expect(mockView.webContents.loadURL)
        .not.toHaveBeenCalledWith(expect.stringMatching(/settings\/index.html$/));
    });
  });
  describe('activateService', () => {
    let activeService;
    beforeEach(() => {
      activeService = {
        setBounds: jest.fn(),
        webContents: {focus: jest.fn()}
      };
      serviceManagerModule.getService = jest.fn(id => (id === 'validId' ? activeService : null));
    });
    test('no active service, should do nothing', async () => {
      // Given
      await waitForTrayInit(() => main.init());
      // When
      mockIpc.emit('activateService', {}, {id: 'not here'});
      // Then
      expect(electron.BaseWindow.getAllWindows()[0].getContentBounds).not.toHaveBeenCalled();
    });
    test('active service, should resize service tab and set it as the main window browser view', async () => {
      // Given
      await waitForTrayInit(() => main.init());
      const baseWindow = electron.BaseWindow.getAllWindows()[0];
      baseWindow.getContentBounds = jest.fn(() => ({width: 13, height: 83}));
      // When
      mockIpc.emit('activateService', {}, {id: 'validId'});
      // Then
      expect(activeService.setBounds).toHaveBeenCalledWith({x: 0, y: 46, width: 13, height: 37});
      expect(baseWindow.contentView.addChildView)
        .toHaveBeenCalledWith(expect.objectContaining({isTabContainer: true}));
      expect(baseWindow.contentView.addChildView).toHaveBeenCalledWith(activeService);
      expect(activeService.webContents.focus).toHaveBeenCalledTimes(1);
    });
    test('#23, setBounds should be called AFTER adding view to BaseWindow', async () => {
      // Given
      await waitForTrayInit(() => main.init());
      const baseWindow = electron.BaseWindow.getAllWindows()[0];
      baseWindow.getContentBounds = jest.fn(() => ({width: 13, height: 83}));
      // When
      mockIpc.emit('activateService', {}, {id: 'validId'});
      // Then
      expect(baseWindow.contentView.addChildView).toHaveBeenCalledBefore(mockView.setBounds);
      expect(baseWindow.contentView.addChildView).toHaveBeenCalledBefore(mockView.setBounds);
      expect(baseWindow.contentView.addChildView).toHaveBeenCalledBefore(activeService.setBounds);
      expect(baseWindow.contentView.addChildView).toHaveBeenCalledBefore(activeService.setBounds);
    });
  });
  test('canNotify, should call to the canNotify method of the serviceManager', () => {
    // Given
    const mockIpcMainEvent = {returnValue: null};
    serviceManagerModule.canNotify = jest.fn(() => 'yepe');
    main.init();
    // When
    mockIpc.send('canNotify', mockIpcMainEvent, 'validId');
    // Then
    expect(serviceManagerModule.canNotify).toHaveBeenCalledWith('validId');
    expect(mockIpcMainEvent.returnValue).toBe('yepe');
  });
  test('notificationClick, should restore window and activate tab', async () => {
    // Given
    settings.updateSettings({startMinimized: true});
    jest.spyOn(serviceManagerModule, 'getService').mockImplementation();
    await waitForTrayInit(() => main.init());
    const baseWindow = electron.BaseWindow.getAllWindows()[0];
    baseWindow.restore = jest.fn();
    baseWindow.show = jest.fn();
    // When
    mockIpc.send('notificationClick', {}, {tabId: 'validId'});
    // Then
    expect(mockView.webContents.send).toHaveBeenCalledWith('activateServiceInContainer', {tabId: 'validId'});
    expect(baseWindow.restore).toHaveBeenCalledTimes(1);
    expect(baseWindow.show).toHaveBeenCalledTimes(1);
    expect(baseWindow.show).toHaveBeenCalledAfter(baseWindow.restore);
    expect(serviceManagerModule.getService).toHaveBeenCalledWith('validId');
  });
  test('handleReload', () => {
    const event = {sender: {reloadIgnoringCache: jest.fn()}};
    main.init();
    // When
    mockIpc.send('reload', event);
    // Then
    expect(event.sender.reloadIgnoringCache).toHaveBeenCalledTimes(1);
  });
  describe('handleSpecificTabReload', () => {
    test('valid tab ID, should reload the specified tab', () => {
      // Given
      const mockTab = {
        webContents: {reloadIgnoringCache: jest.fn()}
      };
      jest.spyOn(serviceManagerModule, 'getService').mockReturnValue(mockTab);
      main.init();
      // When
      mockIpc.send('reloadTab', {}, {tabId: 'test-tab-id'});
      // Then
      expect(serviceManagerModule.getService).toHaveBeenCalledWith('test-tab-id');
      expect(mockTab.webContents.reloadIgnoringCache).toHaveBeenCalledTimes(1);
    });
    test('invalid tab ID, should do nothing', () => {
      // Given
      jest.spyOn(serviceManagerModule, 'getService').mockReturnValue(null);
      main.init();
      // When
      mockIpc.send('reloadTab', {}, {tabId: 'invalid-id'});
      // Then
      expect(serviceManagerModule.getService).toHaveBeenCalledWith('invalid-id');
      // No error should be thrown
    });
  });
  test('handleZoomIn', () => {
    const event = {sender: {
      getZoomFactor: jest.fn(() => 0),
      setZoomFactor: jest.fn()
    }};
    main.init();
    // When
    mockIpc.send('zoomIn', event);
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
      mockIpc.send('zoomOut', event);
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
      mockIpc.send('zoomOut', event);
      // Then
      expect(event.sender.setZoomFactor).not.toHaveBeenCalled();
    });
  });
  test('handleZoomReset', () => {
    const event = {sender: {setZoomFactor: jest.fn()}};
    main.init();
    // When
    mockIpc.send('zoomReset', event);
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
      mockIpc.send('tabReorder', {}, {tabIds: ['313373', '1337']});
      // Then
      const updatedSettings = settings.loadSettings();
      expect(updatedSettings.tabs).toEqual([{id: '313373'}, {id: '1337'}]);
    });
    test('Several tabs, order changed, should update serviceManager order', () => {
      // Given
      settings.updateSettings({tabs: [{id: '1337'}, {id: '313373'}]});
      jest.spyOn(serviceManagerModule, 'sortServices').mockImplementation();
      main.init();
      // When
      mockIpc.send('tabReorder', {}, {tabIds: ['313373', '1337']});
      // Then
      expect(serviceManagerModule.sortServices).toHaveBeenCalledWith(['313373', '1337']);
    });
    test('Several tabs with hidden, order changed, should update settings keeping hidden tags', () => {
      // Given
      settings.updateSettings({tabs: [
        {id: '1337'}, {id: 'hidden'}, {id: '313373'}, {id: 'hidden-too'}
      ]});
      main.init();
      // When
      mockIpc.send('tabReorder', {}, {tabIds: ['313373', '1337']});
      // Then
      expect(settings.loadSettings().tabs).toEqual([
        {id: '313373'}, {id: '1337'}, {id: 'hidden'}, {id: 'hidden-too'}
      ]);
    });
  });
});
