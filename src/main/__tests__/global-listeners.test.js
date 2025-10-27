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
  let baseWindow;
  let eventBus;
  let settings;
  beforeEach(async () => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    await require('../../__tests__').testUserAgent();
    settings = await require('../../__tests__').testSettings();
    settings.updateSettings({
      keyboardShortcuts: {
        tabSwitchModifier: 'Alt',
        tabTraverseModifier: 'Alt'
      },
      trayEnabled: true
    });
    eventBus = electron.ipcMain;
    const trayInitPromise = new Promise(resolve => electron.ipcMain.on('trayInit', resolve));
    main = require('../');
    main.init();
    await trayInitPromise;
    baseWindow = electron.BaseWindow.getAllWindows()[0];
  });
  test.each([
    'aboutOpenDialog', 'appMenuOpen', 'appMenuClose', 'closeDialog',
    'dictionaryGetAvailable', 'dictionaryGetAvailableNative', 'dictionaryGetEnabled',
    'findInPage', 'findInPageOpen', 'findInPageClose',
    'fullscreenToggle', 'helpOpenDialog', 'keyboardEventsInit', 'quit', 'restore',
    'settingsLoad', 'settingsOpenDialog', 'settingsExport', 'settingsImport', 'settingsSave',
    'tabSwitchToPosition', 'tabTraverseNext', 'tabTraversePrevious',
    'trayInit'
  ])('should register listener for %s', channel => {
    // Then
    expect(eventBus.eventNames()).toContain(channel);
  });
  test('appMenuOpen, should show and resize app-menu', () => {
    // When
    eventBus.send('appMenuOpen');
    // Then
    expect(baseWindow.contentView.addChildView).toHaveBeenCalledWith(
      expect.objectContaining({isAppMenu: true})
    );
    expect(baseWindow.contentView.addChildView).not.toHaveBeenCalledWith(
      expect.objectContaining({isFindInPage: true})
    );
    expect(baseWindow.contentView.addChildView.mock.calls[0][0].setBounds)
      .toHaveBeenCalledWith(expect.objectContaining({
        x: 0, y: 0
      }));
  });
  describe('appMenuClose', () => {
    test('with menu hidden, should return', () => {
      // Given
      baseWindow.contentView.children = [];
      // When
      eventBus.send('appMenuClose');
      // Then
      expect(baseWindow.contentView.removeChildView).not.toHaveBeenCalled();
    });
    test('with menu visible, should hide app-menu', () => {
      // Given
      baseWindow.contentView.children = [{isAppMenu: true}];
      // When
      eventBus.send('appMenuClose');
      // Then
      expect(baseWindow.contentView.removeChildView).toHaveBeenCalledWith(
        expect.objectContaining({isAppMenu: true})
      );
    });
  });
  describe('closeDialog', () => {
    describe('with dialog visible (<= 1 view)', () => {
      let dialog;
      beforeEach(() => {
        dialog = new electron.WebContentsView();
        dialog.isDialog = true;
        baseWindow.contentView.children = [dialog];
      });
      test('should destroy dialog', () => {
        // When
        eventBus.send('closeDialog');
        // Then
        expect(dialog.webContents.destroy).toHaveBeenCalledTimes(1);
      });
      test('should activate current tab', () => {
        // Given
        const serviceManagerModule = require('../../service-manager');
        jest.spyOn(serviceManagerModule, 'getActiveService').mockImplementation();
        // When
        eventBus.send('closeDialog');
        // Then
        expect(serviceManagerModule.getActiveService).toHaveBeenCalledTimes(1);
      });
      test('should not call update settings', () => {
        // Given
        const settingsModule = require('../../settings');
        jest.spyOn(settingsModule, 'updateSettings').mockImplementation();
        // When
        eventBus.send('closeDialog');
        // Then
        expect(settingsModule.updateSettings).not.toHaveBeenCalled();
      });
    });
    test('should return if no dialog is shown (>1 view)', () => {
      // Given
      const view = new electron.WebContentsView();
      baseWindow.contentView.children = [view, view];
      // When
      eventBus.send('closeDialog');
      // Then
      expect(view.webContents.destroy).not.toHaveBeenCalled();
    });
  });
  describe('escape', () => {
    test('with dialog visible, should close dialog', () => {
      // Given
      const dialog = new electron.WebContentsView();
      dialog.isDialog = true;
      baseWindow.contentView.children = [dialog];
      // When
      eventBus.send('escape');
      // Then
      expect(dialog.webContents.destroy).toHaveBeenCalledTimes(1);
    });
    test('with app menu visible, should close app menu', () => {
      // Given
      eventBus.send('appMenuOpen');
      // When
      eventBus.send('escape');
      // Then
      expect(baseWindow.contentView.removeChildView).toHaveBeenCalledWith(
        expect.objectContaining({isAppMenu: true})
      );
    });
    test('with find-in-page visible, should close find-in-page dialog only', () => {
      // Given
      const dialog = new electron.WebContentsView();
      dialog.isDialog = true;
      eventBus.send('appMenuOpen');
      const findInPageDialog = new electron.WebContentsView();
      findInPageDialog.isFindInPage = true;
      baseWindow.contentView.children = [dialog, findInPageDialog];
      // When
      eventBus.send('escape');
      // Then
      expect(dialog.webContents.destroy).not.toHaveBeenCalled();
      expect(baseWindow.contentView.removeChildView).not.toHaveBeenCalledWith(
        expect.objectContaining({isAppMenu: true})
      );
      expect(findInPageDialog.webContents.destroy).toHaveBeenCalledTimes(1);
    });
  });
  describe('fullscreenToggle', () => {
    test('when not fullscreen, should enter fullscreen', () => {
      // Given
      baseWindow.isFullScreen.mockReturnValue(false);
      // When
      eventBus.send('fullscreenToggle');
      // Then
      expect(baseWindow.setFullScreen).toHaveBeenCalledWith(true);
    });
    test('when in fullscreen, should leave fullscreen', () => {
      // Given
      baseWindow.isFullScreen.mockReturnValue(true);
      // When
      eventBus.send('fullscreenToggle');
      // Then
      expect(baseWindow.setFullScreen).toHaveBeenCalledWith(false);
    });
  });
  test('helpOpenDialog, should open help dialog', () => {
    // When
    eventBus.send('helpOpenDialog', {sender: baseWindow.webContents});
    // Then
    const view = electron.WebContentsView.mock.results
      .map(r => r.value).find(bv => bv.webContents.loadedUrl.endsWith('help/index.html'));
    expect(baseWindow.contentView.addChildView).toHaveBeenCalledWith(view);
    expect(view.webContents.loadURL)
      .toHaveBeenCalledWith(expect.stringMatching(/help\/index.html$/));
  });
  describe('keyboardEventsInit, with customized settings, initializes keyboard listeners', () => {
    let webContents;
    beforeEach(() => {
      webContents = new electron.WebContentsView();
      require('../../base-window').registerAppShortcuts({}, webContents);
    });
    test('tabTraverseNext', () => {
      const tabTraverseNext = jest.fn();
      eventBus.once('tabTraverseNext', tabTraverseNext);
      webContents.listeners['before-input-event']({preventDefault: jest.fn()}, {type: 'keyDown', key: 'Tab', alt: true});
      expect(tabTraverseNext).toHaveBeenCalledTimes(1);
    });
    test('tabTraversePrevious', () => {
      const tabTraversePrevious = jest.fn();
      eventBus.once('tabTraversePrevious', tabTraversePrevious);
      webContents.listeners['before-input-event']({preventDefault: jest.fn()}, {type: 'keyDown', key: 'Tab', alt: true, shift: true});
      expect(tabTraversePrevious).toHaveBeenCalledTimes(1);
    });
    test.each([1, 2, 3, 4, 5, 6, 7, 8, 9])('tabSwitchToPosition %i', key => {
      const tabSwitchToPosition = jest.fn();
      eventBus.once('tabSwitchToPosition', tabSwitchToPosition);
      webContents.listeners['before-input-event']({preventDefault: jest.fn()}, {type: 'keyDown', key: `${key}`, alt: true});
      expect(tabSwitchToPosition).toHaveBeenCalledTimes(1);
    });
  });
  test('quit, should exit the application', () => {
    // When
    eventBus.send('quit');
    // Then
    expect(electron.app.exit).toHaveBeenCalledTimes(1);
  });
  test('settingsOpenDialog, should open settings dialog', () => {
    // When
    eventBus.send('settingsOpenDialog');
    // Then
    const view = electron.WebContentsView.mock.results.at(-1).value;
    expect(view).toBeDefined();
    expect(view.isDialog).toBe(true);
    expect(view.webContents.loadURL)
      .toHaveBeenCalledWith(expect.stringMatching(/settings\/index.html$/));
  });
  describe('settingsSave', () => {
    let settingsView;
    beforeEach(() => {
      settingsView = new electron.WebContentsView();
      baseWindow.contentView.children = [settingsView];
    });
    test('should reload settings', () => {
      // When
      eventBus.send('settingsSave', {}, {tabs: [{id: 1337}], enabledDictionaries: []});
      // Then
      const loadedSettings = settings.loadSettings();
      expect(loadedSettings.tabs).toEqual([{id: 1337}]);
    });
    test('should reload fake dictionary renderer', () => {
      // When
      eventBus.send('settingsSave', {}, {tabs: [{id: 1337}], enabledDictionaries: []});
      // Then
      const view = electron.WebContentsView.mock.results.at(0).value;
      expect(view.webContents.loadURL)
        .toHaveBeenCalledWith(expect.stringMatching(/spell-check\/dictionary.renderer\/index.html$/));
    });
    test('should reset all views', () => {
      // Given
      const serviceManagerModule = require('../../service-manager');
      jest.spyOn(serviceManagerModule, 'removeAll').mockImplementation();
      // When
      eventBus.send('settingsSave', {}, {tabs: [{id: 1337}], enabledDictionaries: []});
      // Then
      expect(baseWindow.contentView.removeChildView).toHaveBeenCalledTimes(1);
      expect(baseWindow.contentView.removeChildView).toHaveBeenCalledWith(settingsView);
      expect(serviceManagerModule.removeAll).toHaveBeenCalledTimes(1);
      expect(settingsView.webContents.destroy).toHaveBeenCalledTimes(1);
    });
    test('should set saved theme', () => {
      // When
      eventBus.send('settingsSave', {}, {theme: 'light'});
      // Then
      expect(electron.nativeTheme.themeSource).toEqual('light');
    });
  });
  test('settingsExport, should propagate call to settings.exportSettings', async () => {
    // eslint-disable-next-line no-warning-comments
    // TODO: We'll need a blackbox test
    // When
    const result = await eventBus.send('settingsExport', baseWindow);
    // Then
    expect(result).not.toBeUndefined();
    expect(result).toEqual({success: false, canceled: true});
  });
  test('settingsImport, should propagate call to settings.importSettings', async () => {
    // eslint-disable-next-line no-warning-comments
    // TODO: We'll need a blackbox test
    // When
    const result = await eventBus.send('settingsImport', baseWindow);
    // Then
    expect(result).not.toBeUndefined();
    expect(result).toEqual({success: false, canceled: true});
  });
  describe('handleTabTraverse', () => {
    let serviceManagerModule;
    beforeEach(() => {
      serviceManagerModule = require('../../service-manager');
      jest.spyOn(serviceManagerModule, 'getService').mockImplementation();
    });
    test.each([
      'tabTraverseNext', 'tabTraversePrevious'
    ])('%s, with dialog visible, should not traverse', event => {
      // Given
      baseWindow.contentView.children = [new electron.WebContentsView()];
      // When
      eventBus.send(event);
      // Then
      expect(serviceManagerModule.getService).not.toHaveBeenCalled();
    });
    describe('with tabs visible, should traverse', () => {
      beforeEach(() => {
        baseWindow.getBrowserViews = jest.fn(() => [new electron.BrowserView(), new electron.BrowserView()]);
      });
      test('tabTraverseNext', () => {
        jest.spyOn(serviceManagerModule, 'getNextService').mockImplementation(() => 'nextTabId');
        main.init();
        // When
        eventBus.emit('tabTraverseNext');
        // Then
        expect(serviceManagerModule.getService).toHaveBeenCalledWith('nextTabId');
      });
      test('tabTraversePrevious', () => {
        jest.spyOn(serviceManagerModule, 'getPreviousService').mockImplementation(() => 'previousTabId');
        main.init();
        // When
        eventBus.emit('tabTraversePrevious');
        // Then
        expect(serviceManagerModule.getService).toHaveBeenCalledWith('previousTabId');
      });
      test('tabSwitchToPosition', () => {
        jest.spyOn(serviceManagerModule, 'getServiceAt').mockImplementation(() => 'tabAtPosition');
        main.init();
        // When
        eventBus.send('tabSwitchToPosition');
        // Then
        expect(serviceManagerModule.getService).toHaveBeenCalledWith('tabAtPosition');
      });
    });
  });
  test('trayInit, should initialize tray', () => {
    // Then
    expect(electron.Tray).toHaveBeenCalledTimes(1);
  });
});
