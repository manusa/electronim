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
describe('Tab Manager module test suite', () => {
  let mockBrowserView;
  let mockMenu;
  let mockMenuItem;
  let userAgent;
  let tabManager;
  let mockSettings;
  beforeEach(() => {
    jest.resetModules();
    mockBrowserView = {
      setAutoResize: jest.fn(),
      webContents: {
        session: {},
        executeJavaScript: jest.fn(async () => {}),
        on: jest.fn(),
        loadURL: jest.fn(),
        userAgent: 'Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) ElectronIM/13.337.0 Chrome/WillBeReplacedByLatestChromium Electron/0.0.99 Safari/537.36',
        destroy: jest.fn()
      }
    };
    mockMenu = {};
    jest.mock('electron', () => ({
      app: {},
      BrowserView: jest.fn(() => mockBrowserView),
      Menu: jest.fn(() => mockMenu),
      MenuItem: jest.fn(() => mockMenuItem),
      session: {
        fromPartition: jest.fn(() => ({
          userAgentInterceptor: true
        })),
        defaultSession: {userAgentInterceptor: true}
      }
    }));
    mockSettings = {
      loadSettings: jest.fn(() => ({
        tabs: [{id: '1337', disableNotifications: false}],
        disableNotificationsGlobally: false
      })),
      updateSettings: jest.fn()
    };
    jest.mock('../../settings', () => mockSettings);
    jest.mock('../../spell-check');
    userAgent = require('../../user-agent');
    tabManager = require('../');
  });
  describe('getTab', () => {
    test('with existing tab, should return tab', () => {
      // Given
      tabManager.addTabs({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
      // When
      const result = tabManager.getTab(1337);
      // Then
      expect(result.webContents.loadURL).toHaveBeenCalledWith('https://localhost');
    });
    test('with NON-existing tab, should return undefined', () => {
      // Given
      tabManager.addTabs({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
      // When
      const result = tabManager.getTab(313373);
      // Then
      expect(result).toBeUndefined();
    });
    test('with null id, should return null', () => {
      // Given
      tabManager.addTabs({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
      // When
      const result = tabManager.getTab();
      // Then
      expect(result).toBeNull();
    });
  });
  describe('addTabs', () => {
    test('webPreferences is sandboxed and has no node integration', () => {
      // When
      tabManager.addTabs({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
      // Then
      const BrowserView = require('electron').BrowserView;
      expect(BrowserView).toHaveBeenCalledTimes(1);
      expect(BrowserView).toHaveBeenCalledWith({
        webPreferences: expect.objectContaining({sandbox: true, nodeIntegration: false})
      });
    });
    test('not sandboxed, should use shared session', () => {
      // When
      tabManager.addTabs({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
      // Then
      expect(require('electron').session.fromPartition).not.toHaveBeenCalled();
      expect(require('electron').BrowserView).toHaveBeenCalledWith({
        webPreferences: expect.objectContaining({session: expect.anything()})});
    });
    test('sandboxed, should use isolated session', () => {
      // When
      tabManager.addTabs({send: jest.fn()})([{id: 1337, url: 'https://localhost', sandboxed: true}]);
      // Then
      expect(require('electron').session.fromPartition).toHaveBeenCalledTimes(1);
      expect(require('electron').BrowserView).toHaveBeenCalledWith({
        webPreferences: expect.objectContaining({session: expect.anything()})});
    });
    test('Tab webContents should be configured and loaded', () => {
      // Given
      const mockIpcSender = {send: jest.fn()};
      // When
      tabManager.addTabs(mockIpcSender)([{id: 1337, url: 'https://localhost'}]);
      // Then
      expect(mockBrowserView.webContents.loadURL).toHaveBeenCalledWith('https://localhost');
      expect(mockBrowserView.setAutoResize).toHaveBeenCalledWith({width: false, horizontal: false, height: false, vertical: false});
      expect(mockIpcSender.send).toHaveBeenCalledTimes(1);
      expect(mockIpcSender.send).toHaveBeenCalledWith('addTabs', [{id: 1337, url: 'https://localhost'}]);
    });
    test('Tab webContents should contain a reference to its id', () => {
      // When
      tabManager.addTabs({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
      // Then
      expect(mockBrowserView.webContents.executeJavaScript).toHaveBeenCalledTimes(1);
      expect(mockBrowserView.webContents.executeJavaScript).toHaveBeenCalledWith('window.tabId = \'1337\';');
    });
    describe('cleanUserAgent', () => {
      test('chromium version available, should remove non-standard tokens from user-agent header and set version', () => {
        // Given
        userAgent.BROWSER_VERSIONS.chromium = '79.0.1337.79';
        // When
        tabManager.addTabs({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
        // Then
        const result = tabManager.getTab(1337).webContents.userAgent;
        expect(result).toBe('Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) Chrome/79.0.1337.79 Safari/537.36');
        expect(require('electron').app.userAgentFallback).toBe('Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) Chrome/79.0.1337.79 Safari/537.36');
      });
      test('chromium not version available, should remove non-standard tokens from user-agent header', () => {
        // When
        tabManager.addTabs({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
        // Then
        const result = tabManager.getTab(1337).webContents.userAgent;
        expect(result).toBe('Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) Chrome/WillBeReplacedByLatestChromium Safari/537.36');
        expect(require('electron').app.userAgentFallback).toBe('Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) Chrome/WillBeReplacedByLatestChromium Safari/537.36');
      });
    });
    describe('Event listeners', () => {
      let events;
      let mockIpcSender;
      beforeEach(() => {
        events = {};
        mockBrowserView.webContents.on = jest.fn((id, func) => (events[id] = func));
        mockIpcSender = {send: jest.fn()};
        tabManager.addTabs(mockIpcSender)([{id: '1337', url: 'https://localhost'}]);
      });
      test('handlePageTitleUpdated, should send setTabTitle event', () => {
        // When
        events['page-title-updated'](new Event(''), 'Dr.');
        // Then
        expect(mockIpcSender.send).toHaveBeenCalledWith('setTabTitle', {id: '1337', title: 'Dr.'});
      });
      describe('handlePageFaviconUpdated', () => {
        test('Favicons provided, should send setTabFavicon with the last of the provided favicons', () => {
          // When
          events['page-favicon-updated'](new Event(''), [
            'http://url-to-favicon/aitana.png',
            'http://url-to-favicon/alex.png'
          ]);
          // Then
          expect(mockIpcSender.send)
            .toHaveBeenCalledWith('setTabFavicon', {id: '1337', favicon: 'http://url-to-favicon/alex.png'});
        });
        test('No favicons provided, should send setTabFavicon with the last of the extracted favicons', async () => {
          // Given
          mockBrowserView.webContents.executeJavaScript = jest.fn(arg => {
            if (arg === 'Array.from(document.querySelectorAll(\'link[rel*="icon"]\')).map(el => el.href)') {
              return ['http://url-to-favicon/julia-128.png', 'http://url-to-favicon/julia.png'];
            }
            return [];
          });
          // When
          await events['page-favicon-updated'](new Event(''));
          // Then
          expect(mockIpcSender.send)
            .toHaveBeenCalledWith('setTabFavicon', {id: '1337', favicon: 'http://url-to-favicon/julia.png'});
        });
      });
      describe('handleContextMenu', () => {
        let electron;
        let spellChecker;
        beforeEach(() => {
          electron = require('electron');
          spellChecker = require('../../spell-check');
          mockMenu.append = jest.fn();
          mockMenu.popup = jest.fn();
        });
        test('should open a Menu with DevTools entry', async () => {
          // Given
          spellChecker.contextMenuHandler.mockImplementationOnce(() => []);
          // When
          await events['context-menu'](new Event(''), {x: 13, y: 37});
          // Then
          expect(electron.Menu).toHaveBeenCalledTimes(1);
          expect(electron.MenuItem).toHaveBeenCalledTimes(1);
          expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({label: 'DevTools'}));
          expect(mockMenu.append).toHaveBeenCalledTimes(1);
        });
        test('should open a Menu at the specified location', async () => {
          // Given
          spellChecker.contextMenuHandler.mockImplementationOnce(() => []);
          // When
          await events['context-menu'](new Event(''), {x: 13, y: 37});
          // Then
          expect(mockMenu.popup).toHaveBeenCalledTimes(1);
          expect(mockMenu.popup).toHaveBeenCalledWith({x: 13, y: 37});
        });
        describe('with native spellcheck disabled', () => {
          beforeEach(() => {
            mockBrowserView.webContents.session.spellcheck = false;
          });
          test('Spelling suggestions, should open a Menu with all suggestions, a separator and DevTools entry', async () => {
            // Given
            spellChecker.contextMenuHandler.mockImplementationOnce(() => [
              new electron.MenuItem({label: 'suggestion 1'}),
              new electron.MenuItem({label: 'suggestion 2'})
            ]);
            // When
            await events['context-menu'](new Event(''), {x: 13, y: 37});
            // Then
            expect(electron.Menu).toHaveBeenCalledTimes(1);
            expect(electron.MenuItem).toHaveBeenCalledTimes(4);
            expect(electron.MenuItem).toHaveBeenCalledWith({type: 'separator'});
            expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({label: 'DevTools'}));
            expect(mockMenu.append).toHaveBeenCalledTimes(4);
          });
        });
        describe('with native spellcheck enabled', () => {
          beforeEach(() => {
            mockBrowserView.webContents.session.spellcheck = true;
          });
          test('Spelling suggestions, should open a Menu with all suggestions, a separator and DevTools entry', async () => {
            // Given
            spellChecker.contextMenuNativeHandler.mockImplementationOnce(() => [
              new electron.MenuItem({label: 'suggestion 1'})
            ]);
            // When
            await events['context-menu'](new Event(''), {x: 13, y: 37});
            // Then
            expect(electron.Menu).toHaveBeenCalledTimes(1);
            expect(electron.MenuItem).toHaveBeenCalledTimes(3);
            expect(electron.MenuItem).toHaveBeenCalledWith({type: 'separator'});
            expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({label: 'DevTools'}));
            expect(mockMenu.append).toHaveBeenCalledTimes(3);
          });
        });
      });
    });
  });
  describe('activeTab', () => {
    test('setActiveTab/getActiveTab, should set/return currently active tab', () => {
      // Given
      expect(tabManager.getActiveTab()).toBeNull();
      tabManager.setActiveTab('1337');
      // When
      const result = tabManager.getActiveTab();
      // Then
      expect(result).toBe('1337');
    });
  });
  describe('removeAll', () => {
    test('No tabs, should do nothing', () => {
      // When
      tabManager.removeAll();
      // Then
      expect(mockBrowserView.webContents.destroy).not.toHaveBeenCalled();
    });
    test('Existing tabs, should delete all tabs entries and destroy their BrowserView', () => {
      // Given
      tabManager.addTabs({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
      // When
      tabManager.removeAll();
      // Then
      expect(mockBrowserView.webContents.destroy).toHaveBeenCalledTimes(1);
    });
  });
  describe('canNotify', () => {
    test('Global notifications enabled, Notifications for this tab enabled, should return true', () => {
      // Given
      // When
      const result = tabManager.canNotify('1337');
      // Then
      expect(result).toBe(true);
    });
    test('Global notifications disabled, Notifications for this tab enabled, should return false', () => {
      // Given
      mockSettings.loadSettings = jest.fn(() => ({
        tabs: [{id: '1337', disableNotifications: false}],
        disableNotificationsGlobally: true
      }));
      // When
      const result = tabManager.canNotify('1337');
      // Then
      expect(result).toBe(false);
    });
    test('Global notifications enabled, Notifications for this tab disabled, should return false', () => {
      // Given
      mockSettings.loadSettings = jest.fn(() => ({
        tabs: [{id: '1337', disableNotifications: true}],
        disableNotificationsGlobally: false
      }));
      // When
      const result = tabManager.canNotify('1337');
      // Then
      expect(result).toBe(false);
    });
    test('Notifications undefined in settings, should return true (Opt-out setting)', () => {
      // Given
      mockSettings.loadSettings = jest.fn(() => ({
        tabs: [{id: '1337'}]
      }));
      // When
      const result = tabManager.canNotify('1337');
      // Then
      expect(result).toBe(true);
    });
  });
});
