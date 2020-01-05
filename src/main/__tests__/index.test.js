describe('Main module test suite', () => {
  let mockBrowserWindow;
  let mockIpc;
  let mockSettings;
  let settingsModule;
  let tabManagerModule;
  let main;
  beforeEach(() => {
    mockBrowserWindow = {
      listeners: {},
      on: jest.fn((eventName, func) => {
        mockBrowserWindow.listeners[eventName] = func;
      }),
      removeMenu: jest.fn()
    };
    mockIpc = {
      listeners: {},
      on: jest.fn((eventName, func) => {
        mockIpc.listeners[eventName] = func;
      })
    };
    mockSettings = {};
    jest.resetModules();
    jest.mock('electron', () => ({
      BrowserWindow: jest.fn(() => mockBrowserWindow),
      ipcMain: mockIpc
    }));
    jest.mock('../../chrome-tabs', () => ({
      initTabContainer: jest.fn()
    }));
    jest.mock('../../settings', () => ({
      loadSettings: jest.fn(() => mockSettings),
      openSettingsDialog: jest.fn(),
      updateSettings: jest.fn()
    }));
    settingsModule = require('../../settings');
    jest.mock('../../spell-check');
    jest.mock('../../tab-manager', () => ({
      getActiveTab: jest.fn()
    }));
    tabManagerModule = require('../../tab-manager');
    main = require('../');
  });
  describe('mainWindow evnets', () => {
    test('maximize', () => {
      // Given
      main.init();
      // When
      mockBrowserWindow.listeners.maximize();
      // Then
      expect(tabManagerModule.getActiveTab).toHaveBeenCalledTimes(1);
    });
  });
  describe('initTabListener ipc events', () => {
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
    });
    test('settingsOpenDialog', () => {
      // Given
      main.init();
      // When
      mockIpc.listeners.settingsOpenDialog();
      // Then
      expect(settingsModule.openSettingsDialog).toHaveBeenCalledTimes(1);
    });
  });
});
