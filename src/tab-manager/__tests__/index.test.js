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
  let tabManager;
  beforeEach(() => {
    mockBrowserView = {
      setAutoResize: jest.fn(),
      webContents: {
        executeJavaScript: jest.fn(),
        on: jest.fn(),
        loadURL: jest.fn(),
        userAgent: 'Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) ElectronIM/13.337.0 Chrome/79.0.1337.79 Electron/0.0.99 Safari/537.36'
      }
    };
    mockMenu = {};
    jest.resetModules();
    jest.mock('electron', () => ({
      BrowserView: jest.fn(() => mockBrowserView),
      Menu: jest.fn(() => mockMenu),
      MenuItem: jest.fn(() => mockMenuItem)
    }));
    jest.mock('../../settings');
    jest.mock('../../spell-check');
    tabManager = require('../');
  });
  describe('getTab', () => {
    test('getTab, existing tab, should return tab', () => {
      // Given
      tabManager.addTabs({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
      // When
      const result = tabManager.getTab(1337);
      // Then
      expect(result.webContents.loadURL).toHaveBeenCalledWith('https://localhost');
    });
    test('getTab, NON-existing tab, should return undefined', () => {
      // Given
      tabManager.addTabs({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
      // When
      const result = tabManager.getTab(313373);
      // Then
      expect(result).toBeUndefined();
    });
    test('getTab, null id, should return null', () => {
      // Given
      tabManager.addTabs({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
      // When
      const result = tabManager.getTab();
      // Then
      expect(result).toBeNull();
    });
  });
  describe('addTabs', () => {
    test('Tab webContents should be configured and loaded', () => {
      // Given
      const mockIpcSender = {send: jest.fn()};
      // When
      tabManager.addTabs(mockIpcSender)([{id: 1337, url: 'https://localhost'}]);
      // Then
      expect(mockBrowserView.webContents.loadURL).toHaveBeenCalledWith('https://localhost');
      expect(mockBrowserView.setAutoResize).toHaveBeenCalledWith({width: true, height: true});
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
    test('cleanUserAgent, should remove non-standard tokens from user-agent header', () => {
      // Given
      tabManager.addTabs({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
      // When
      const result = tabManager.getTab(1337).webContents.userAgent;
      // Then
      expect(result).toBe('Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) Chrome/79 Safari/537.36');
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
        test('No spelling suggestions, should open a Menu with DevTools entry', async () => {
          // Given
          spellChecker.contextMenuHandler.mockImplementationOnce(() => []);
          // When
          await events['context-menu'](new Event(''), {x: 13, y: 37});
          // Then
          expect(electron.Menu).toHaveBeenCalledTimes(1);
          expect(electron.MenuItem).toHaveBeenCalledTimes(1);
          expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({label: 'DevTools'}));
          expect(mockMenu.append).toHaveBeenCalledTimes(1);
          expect(mockMenu.popup).toHaveBeenCalledTimes(1);
          expect(mockMenu.popup).toHaveBeenCalledWith({x: 13, y: 37});
        });
        test('Spelling suggestions, should open a Menu with all suggestions, a sperator and DevTools entry', async () => {
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
          expect(mockMenu.popup).toHaveBeenCalledTimes(1);
          expect(mockMenu.popup).toHaveBeenCalledWith({x: 13, y: 37});
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
      // Given
      mockBrowserView.destroy = jest.fn();
      // When
      tabManager.removeAll();
      // Then
      expect(mockBrowserView.destroy).not.toHaveBeenCalled();
    });
    test('Existing tabs, should delete all tabs entries and destroy their BrowserView', () => {
      // Given
      mockBrowserView.destroy = jest.fn();
      tabManager.addTabs({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
      // When
      tabManager.removeAll();
      // Then
      expect(mockBrowserView.destroy).toHaveBeenCalledTimes(1);
    });
  });
});
