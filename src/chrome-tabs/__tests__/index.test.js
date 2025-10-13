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
describe('Chrome Tabs Module module test suite', () => {
  let electron;
  let chromeTabs;
  beforeEach(() => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    jest.mock('../check-for-updates', () => ({
      getLatestRelease: () => Promise.resolve({})
    }));
    chromeTabs = require('../');
  });
  describe('handleContextMenu', () => {
    let tabContainer;
    let contextMenuListener;
    beforeEach(() => {
      tabContainer = chromeTabs.newTabContainer();
      contextMenuListener = tabContainer.webContents.listeners('context-menu');
    });
    test('should show Reload option when right-clicking on a tab', async () => {
      // Given
      const event = {};
      const params = {x: 100, y: 50};
      tabContainer.webContents.executeJavaScript.mockResolvedValue('test-tab-id');
      // When
      await contextMenuListener(event, params);
      // Then
      expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({
        label: 'Reload'
      }));
    });
    test('should not show Reload option when not clicking on a tab', async () => {
      // Given
      const event = {};
      const params = {x: 100, y: 50};
      tabContainer.webContents.executeJavaScript.mockResolvedValue(null);
      // When
      await contextMenuListener(event, params);
      // Then
      const reloadMenuItem = electron.MenuItem.mock.calls.find(call => call[0].label === 'Reload');
      expect(reloadMenuItem).toBeUndefined();
    });
    test('should emit reloadTab event when Reload is clicked', async () => {
      // Given
      const event = {};
      const params = {x: 100, y: 50};
      const tabId = 'test-tab-id';
      tabContainer.webContents.executeJavaScript.mockResolvedValue(tabId);
      // When
      await contextMenuListener(event, params);
      const reloadMenuItem = electron.MenuItem.mock.calls.find(call => call[0].label === 'Reload')[0];
      reloadMenuItem.click();
      // Then
      expect(electron.ipcMain.emit).toHaveBeenCalledWith('reloadTab', event, {tabId});
    });
    test('should always show Settings, Help, and DevTools options', async () => {
      // Given
      const event = {};
      const params = {x: 100, y: 50};
      tabContainer.webContents.executeJavaScript.mockResolvedValue(null);
      // When
      await contextMenuListener(event, params);
      // Then
      expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({label: 'Settings'}));
      expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({label: 'Help'}));
      expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({label: 'DevTools'}));
    });
  });
  describe('newTabContainer', () => {
    test('webPreferences is sandboxed and has no node integration', () => {
      // When
      chromeTabs.newTabContainer();
      // Then
      const WebContentsView = electron.WebContentsView;
      expect(WebContentsView).toHaveBeenCalledTimes(1);
      expect(WebContentsView).toHaveBeenCalledWith({
        webPreferences: expect.objectContaining({sandbox: true, nodeIntegration: false})
      });
    });
    test('checks for updates', async () => {
      // Given
      const {webContentsViewInstance} = electron;
      let resolveSend;
      const isSent = new Promise(resolve => {
        resolveSend = resolve;
      });
      webContentsViewInstance.webContents.send = jest.fn(() => resolveSend(true));
      chromeTabs.newTabContainer();
      // When
      electron.ipcMain.emit('tabsReady');
      // Then
      await expect(isSent).resolves.toBe(true);
      expect(webContentsViewInstance.webContents.send).toHaveBeenCalledWith('electronimNewVersionAvailable', true);
    });
    test('sets interval to check for updates with unref', () => {
      // Given
      const unref = jest.fn();
      globalThis.setInterval = jest.fn(() => ({unref}));
      // When
      chromeTabs.newTabContainer();
      // Then
      expect(setInterval).toHaveBeenCalled();
      expect(unref).toHaveBeenCalled();
    });
  });
  describe('context menu', () => {
    let tabContainer;
    beforeEach(() => {
      tabContainer = chromeTabs.newTabContainer();
    });
    describe('registration', () => {
      test('should register context-menu listener on tab container', () => {
        // Then
        expect(tabContainer.webContents.on).toHaveBeenCalledWith('context-menu', expect.any(Function));
      });
    });
    describe('menu items', () => {
      let menu;
      beforeEach(() => {
        // When - trigger context menu
        const contextMenuHandler = tabContainer.listeners['context-menu'];
        contextMenuHandler({}, {x: 100, y: 200});
        menu = electron.Menu.mock.results[electron.Menu.mock.results.length - 1].value;
      });
      test('should create menu with three items', () => {
        expect(menu.entries).toHaveLength(3);
      });
      test('should have Settings menu item', () => {
        expect(menu.entries[0]).toEqual(expect.objectContaining({label: 'Settings'}));
      });
      test('should have Help menu item', () => {
        expect(menu.entries[1]).toEqual(expect.objectContaining({label: 'Help'}));
      });
      test('should have DevTools menu item', () => {
        expect(menu.entries[2]).toEqual(expect.objectContaining({label: 'DevTools'}));
      });
      test('should popup menu at cursor position', () => {
        expect(menu.popup).toHaveBeenCalledWith({x: 100, y: 200});
      });
    });
    describe('menu actions', () => {
      let menu;
      let settingsListener;
      let helpListener;
      beforeEach(() => {
        // Given - register event listeners
        settingsListener = jest.fn();
        helpListener = jest.fn();
        electron.ipcMain.on('settingsOpenDialog', settingsListener);
        electron.ipcMain.on('helpOpenDialog', helpListener);
        // When - trigger context menu
        const contextMenuHandler = tabContainer.listeners['context-menu'];
        contextMenuHandler({}, {x: 100, y: 200});
        menu = electron.Menu.mock.results[electron.Menu.mock.results.length - 1].value;
      });
      test('Settings click should emit settingsOpenDialog event', () => {
        // When
        menu.entries[0].click();
        // Then
        expect(settingsListener).toHaveBeenCalledWith(expect.anything(), expect.anything());
      });
      test('Help click should emit helpOpenDialog event', () => {
        // When
        menu.entries[1].click();
        // Then
        expect(helpListener).toHaveBeenCalledWith(expect.anything(), expect.anything());
      });
      test('DevTools click should open DevTools in detached mode', () => {
        // When
        menu.entries[2].click();
        // Then
        expect(tabContainer.webContents.openDevTools).toHaveBeenCalledWith({mode: 'detach', activate: true});
      });
    });
  });
});
