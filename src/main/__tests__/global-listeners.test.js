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
describe('Main :: Global listeners test suite', () => {
  let electron;
  let main;
  let browserWindow;
  let eventBus;
  beforeEach(() => {
    jest.resetModules();
    // Always mock settings unless we want to overwrite the real settings file !
    jest.mock('../../settings');
    require('../../settings').loadSettings.mockImplementation(() => ({
      trayEnabled: true
    }));
    require('../../settings').openSettingsDialog = jest.requireActual('../../settings').openSettingsDialog;
    jest.mock('electron', () => require('../../__tests__').mockElectronInstance({
      // Return a **different** instance for each view
      BrowserView: jest.fn(() => require('../../__tests__').mockBrowserWindowInstance())
    }));
    electron = require('electron');
    browserWindow = electron.browserWindowInstance;
    eventBus = electron.ipcMain;
    jest.spyOn(require('../../user-agent'), 'initBrowserVersions')
      .mockImplementation(() => Promise.resolve({}));
    main = require('../');
    main.init();
  });
  test('appMenuOpen, should show and resize app-menu', () => {
    // When
    eventBus.listeners.appMenuOpen();
    // Then
    expect(browserWindow.addBrowserView).toHaveBeenCalledWith(
      expect.objectContaining({isAppMenu: true})
    );
    expect(browserWindow.addBrowserView.mock.calls[0][0].setBounds).toHaveBeenCalledWith(expect.objectContaining({
      x: 0, y: 0
    }));
  });
  describe('appMenuClose', () => {
    test('with menu hidden, should return', () => {
      // Given
      browserWindow.getBrowserViews = jest.fn(() => []);
      // When
      eventBus.listeners.appMenuClose();
      // Then
      expect(browserWindow.removeBrowserView).not.toHaveBeenCalled();
    });
    test('with menu visible, should hide app-menu', () => {
      // Given
      browserWindow.getBrowserViews = jest.fn(() => [{isAppMenu: true}]);
      // When
      eventBus.listeners.appMenuClose();
      // Then
      expect(browserWindow.removeBrowserView).toHaveBeenCalledWith(
        expect.objectContaining({isAppMenu: true})
      );
    });
  });
  describe('closeDialog', () => {
    describe('with dialog visible (<= 1 view)', () => {
      let dialog;
      beforeEach(() => {
        dialog = new electron.BrowserView();
        browserWindow.getBrowserViews = jest.fn(() => [dialog]);
        browserWindow.getBrowserView = jest.fn(() => (dialog));
      });
      test('should destroy dialog', () => {
        // When
        eventBus.listeners.closeDialog();
        // Then
        expect(dialog.webContents.destroy).toHaveBeenCalledTimes(1);
      });
      test('should activate current tab', () => {
        // Given
        const tabManagerModule = require('../../tab-manager');
        jest.spyOn(tabManagerModule, 'getActiveTab').mockImplementation();
        // When
        eventBus.listeners.closeDialog();
        // Then
        expect(tabManagerModule.getActiveTab).toHaveBeenCalledTimes(1);
      });
      test('should not call update settings', () => {
        // Given
        const settingsModule = require('../../settings');
        jest.spyOn(settingsModule, 'updateSettings').mockImplementation();
        // When
        eventBus.listeners.closeDialog();
        // Then
        expect(settingsModule.updateSettings).not.toHaveBeenCalled();
      });
    });
    test('should return if no dialog is shown (>1 view)', () => {
      // Given
      const view = new electron.BrowserView();
      browserWindow.getBrowserViews = jest.fn(() => [view, view]);
      // When
      eventBus.listeners.closeDialog();
      // Then
      expect(view.webContents.destroy).not.toHaveBeenCalled();
    });
  });
  describe('fullscreenToggle', () => {
    test('when not fullscreen, should enter fullscreen', () => {
      // Given
      browserWindow.isFullScreen.mockReturnValue(false);
      // When
      eventBus.listeners.fullscreenToggle();
      // Then
      expect(browserWindow.setFullScreen).toHaveBeenCalledWith(true);
    });
    test('when in fullscreen, should leave fullscreen', () => {
      // Given
      browserWindow.isFullScreen.mockReturnValue(true);
      // When
      eventBus.listeners.fullscreenToggle();
      // Then
      expect(browserWindow.setFullScreen).toHaveBeenCalledWith(false);
    });
  });
  test('helpOpenDialog, should open help dialog', () => {
    // When
    eventBus.listeners.helpOpenDialog({sender: browserWindow.webContents});
    // Then
    const browserView = electron.BrowserView.mock.results
      .map(r => r.value).filter(bv => bv.webContents.loadedUrl.endsWith('help/index.html'))[0];
    expect(browserWindow.setBrowserView).toHaveBeenCalledWith(browserView);
    expect(browserView.webContents.loadURL)
      .toHaveBeenCalledWith(expect.stringMatching(/help\/index.html$/));
  });
  test('quit, should exit the application', () => {
    // When
    eventBus.listeners.quit();
    // Then
    expect(electron.app.exit).toHaveBeenCalledTimes(1);
  });
  test('settingsOpenDialog, should open settings dialog', () => {
    // When
    eventBus.listeners.settingsOpenDialog();
    // Then
    const browserView = electron.BrowserView.mock.results
      .map(r => r.value).filter(bv => bv.webContents.loadedUrl.endsWith('settings/index.html'))[0];
    expect(browserWindow.setBrowserView).toHaveBeenCalledWith(browserView);
    expect(browserView.webContents.loadURL)
      .toHaveBeenCalledWith(expect.stringMatching(/settings\/index.html$/));
  });
  describe('settingsSave', () => {
    let settings;
    beforeEach(() => {
      settings = new electron.BrowserView();
      browserWindow.getBrowserViews = jest.fn(() => [settings]);
      browserWindow.getBrowserView = jest.fn(() => (settings));
    });
    test('should reload settings', () => {
      // Given
      const settingsModule = require('../../settings');
      // When
      eventBus.listeners.settingsSave({}, {tabs: [{id: 1337}], enabledDictionaries: []});
      // Then
      expect(electron.browserWindowInstance.loadURL)
        .toHaveBeenCalledWith(expect.stringMatching(/spell-check\/dictionary.renderer\/index.html$/));
      expect(settingsModule.updateSettings).toHaveBeenCalledTimes(1);
    });
    test('should reset all views', () => {
      // Given
      const tabManagerModule = require('../../tab-manager');
      jest.spyOn(tabManagerModule, 'removeAll').mockImplementation();
      // When
      eventBus.listeners.settingsSave({}, {tabs: [{id: 1337}], enabledDictionaries: []});
      // Then
      expect(browserWindow.removeBrowserView).toHaveBeenCalledTimes(1);
      expect(browserWindow.removeBrowserView).toHaveBeenCalledWith(settings);
      expect(tabManagerModule.removeAll).toHaveBeenCalledTimes(1);
      expect(settings.webContents.destroy).toHaveBeenCalledTimes(1);
    });
    test('should set saved theme', () => {
      // When
      eventBus.listeners.settingsSave({}, {theme: 'light'});
      // Then
      expect(electron.nativeTheme.themeSource).toEqual('light');
    });
  });
  describe('handleTabTraverse', () => {
    let tabManagerModule;
    beforeEach(() => {
      tabManagerModule = require('../../tab-manager');
      jest.spyOn(tabManagerModule, 'getTab').mockImplementation();
    });
    test.each([
      'tabTraverseNext', 'tabTraversePrevious'
    ])('%s, with dialog visible, should not traverse', event => {
      // Given
      browserWindow.getBrowserViews = jest.fn(() => [new electron.BrowserView()]);
      main.init();
      // When
      eventBus.listeners[event]();
      // Then
      expect(tabManagerModule.getTab).not.toHaveBeenCalled();
    });
    describe('with tabs visible, should traverse', () => {
      beforeEach(() => {
        browserWindow.getBrowserViews = jest.fn(() => [new electron.BrowserView(), new electron.BrowserView()]);
      });
      test('tabTraverseNext', () => {
        jest.spyOn(tabManagerModule, 'getNextTab').mockImplementation(() => 'nextTabId');
        main.init();
        // When
        eventBus.listeners.tabTraverseNext();
        // Then
        expect(tabManagerModule.getTab).toHaveBeenCalledWith('nextTabId');
      });
      test('tabTraversePrevious', () => {
        jest.spyOn(tabManagerModule, 'getPreviousTab').mockImplementation(() => 'previousTabId');
        main.init();
        // When
        eventBus.listeners.tabTraversePrevious();
        // Then
        expect(tabManagerModule.getTab).toHaveBeenCalledWith('previousTabId');
      });
      test('tabSwitchToPosition', () => {
        jest.spyOn(tabManagerModule, 'getTabAt').mockImplementation(() => 'tabAtPosition');
        main.init();
        // When
        eventBus.listeners.tabSwitchToPosition();
        // Then
        expect(tabManagerModule.getTab).toHaveBeenCalledWith('tabAtPosition');
      });
    });
  });
  test('trayInit, should initialize tray', () => {
    // Then
    expect(electron.Tray).toHaveBeenCalledTimes(1);
  });
});
