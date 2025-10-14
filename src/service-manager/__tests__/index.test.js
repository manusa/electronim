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
describe('Service Manager module test suite', () => {
  let electron;
  let userAgent;
  let serviceManager;
  let settings;
  beforeEach(async () => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    settings = await require('../../__tests__').testSettings();
    userAgent = require('../../user-agent');
    serviceManager = require('../');
  });
  describe('getService', () => {
    test('with existing service, should return service', () => {
      // Given
      serviceManager.addServices({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
      // When
      const result = serviceManager.getService(1337);
      // Then
      expect(result.webContents.loadURL).toHaveBeenCalledWith('https://localhost');
    });
    test('with NON-existing service, should return undefined', () => {
      // Given
      serviceManager.addServices({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
      // When
      const result = serviceManager.getService(313373);
      // Then
      expect(result).toBeUndefined();
    });
    test('with null id, should return null', () => {
      // Given
      serviceManager.addServices({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
      // When
      const result = serviceManager.getService();
      // Then
      expect(result).toBeNull();
    });
  });
  describe('Service traversal functions', () => {
    beforeEach(() => {
      serviceManager.addServices({send: jest.fn()})([
        {id: 'A'},
        {id: 'B'},
        {id: 'C'}
      ]);
    });
    describe('getNextService with services [A, B, C]', () => {
      test('with currentService = A, should return B', () => {
        // Given
        serviceManager.setActiveService('A');
        // When
        const nextService = serviceManager.getNextService();
        // Then
        expect(nextService).toBe('B');
      });
      test('with currentService = C, should return A', () => {
        // Given
        serviceManager.setActiveService('C');
        // When
        const nextService = serviceManager.getNextService();
        // Then
        expect(nextService).toBe('A');
      });
    });
    describe('getPreviousService', () => {
      test('with currentService = B, should return A', () => {
        // Given
        serviceManager.setActiveService('B');
        // When
        const nextService = serviceManager.getPreviousService();
        // Then
        expect(nextService).toBe('A');
      });
      test('with currentService = A, should return C', () => {
        // Given
        serviceManager.setActiveService('A');
        // When
        const nextService = serviceManager.getPreviousService();
        // Then
        expect(nextService).toBe('C');
      });
    });
    describe('getServiceAt', () => {
      test('with position in range, should return service in range', () => {
        // When
        const nextService = serviceManager.getServiceAt(2);
        // Then
        expect(nextService).toBe('B');
      });
      test('with position out of range (upper), should return last', () => {
        // When
        const nextService = serviceManager.getServiceAt(9);
        // Then
        expect(nextService).toBe('C');
      });
      test('with position out of range (lower), should return last', () => {
        // When
        const nextService = serviceManager.getServiceAt(-1);
        // Then
        expect(nextService).toBe('A');
      });
    });
  });
  describe('addServices', () => {
    test('webPreferences is sandboxed and has no node integration', () => {
      // When
      serviceManager.addServices({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
      // Then
      expect(electron.WebContentsView).toHaveBeenCalledTimes(1);
      expect(electron.WebContentsView).toHaveBeenCalledWith({
        webPreferences: expect.objectContaining({sandbox: true, nodeIntegration: false})
      });
    });
    test('not sandboxed, should use shared session', () => {
      // When
      serviceManager.addServices({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
      // Then
      expect(electron.session.fromPartition).not.toHaveBeenCalled();
      expect(electron.WebContentsView).toHaveBeenCalledWith({
        webPreferences: expect.objectContaining({session: expect.anything()})});
    });
    test('sandboxed, should use isolated session', () => {
      // When
      serviceManager.addServices({send: jest.fn()})([{id: 1337, url: 'https://localhost', sandboxed: true}]);
      // Then
      expect(electron.session.fromPartition).toHaveBeenCalledTimes(1);
      expect(electron.WebContentsView).toHaveBeenCalledWith({
        webPreferences: expect.objectContaining({session: expect.anything()})});
    });
    test('openUrlsInApp=true, should not set setWindowOpenHandler', () => {
      // When
      serviceManager.addServices({send: jest.fn()})([{id: 1337, url: 'https://localhost', openUrlsInApp: true}]);
      // Then
      expect(electron.WebContentsView.mock.results[0].value.webContents.setWindowOpenHandler).not.toHaveBeenCalled();
    });
    test('openUrlsInApp=true, should not set will-navigate event handler', () => {
      // When
      serviceManager.addServices({send: jest.fn()})([{id: 1337, url: 'https://localhost', openUrlsInApp: true}]);
      // Then
      expect(electron.WebContentsView.mock.results[0].value.listeners['will-navigate']).not.toBeDefined();
    });
    test('Tab webContents should be configured and loaded', () => {
      // Given
      const mockIpcSender = {send: jest.fn()};
      // When
      serviceManager.addServices(mockIpcSender)([{id: 1337, url: 'https://localhost'}]);
      // Then
      expect(electron.WebContentsView.mock.results[0].value.webContents.loadURL).toHaveBeenCalledWith('https://localhost');
      expect(mockIpcSender.send).toHaveBeenCalledTimes(1);
      expect(mockIpcSender.send).toHaveBeenCalledWith('addServices', [{id: 1337, url: 'https://localhost'}]);
    });
    test('Tab webContents should contain a reference to its id', () => {
      // When
      serviceManager.addServices({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
      // Then
      expect(electron.WebContentsView.mock.results[0].value.webContents.executeJavaScript).toHaveBeenCalledTimes(1);
      expect(electron.WebContentsView.mock.results[0].value.webContents.executeJavaScript)
        .toHaveBeenCalledWith('window.tabId = \'1337\';window.serviceId = \'1337\';');
    });
    describe('cleanUserAgent', () => {
      test('chromium version available, should remove non-standard tokens from user-agent header and set version', () => {
        // Given
        userAgent.BROWSER_VERSIONS.chromium = '79.0.1337.79';
        // When
        serviceManager.addServices({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
        // Then
        const result = serviceManager.getService(1337).webContents.userAgent;
        expect(result).toBe('Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) Chrome/79.0.1337.79 Safari/537.36');
        expect(require('electron').app.userAgentFallback).toBe('Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) Chrome/79.0.1337.79 Safari/537.36');
      });
      test('chromium not version available, should remove non-standard tokens from user-agent header', () => {
        // When
        serviceManager.addServices({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
        // Then
        const result = serviceManager.getService(1337).webContents.userAgent;
        expect(result).toBe('Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) Chrome/WillBeReplacedByLatestChromium Safari/537.36');
        expect(require('electron').app.userAgentFallback).toBe('Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) Chrome/WillBeReplacedByLatestChromium Safari/537.36');
      });
    });
    describe('Event listeners', () => {
      let mockIpcSender;
      beforeEach(() => {
        mockIpcSender = {send: jest.fn()};
        serviceManager.addServices(mockIpcSender)([{id: '1337', url: 'https://localhost'}]);
      });
      test('handlePageTitleUpdated, should send setServiceTitle event', () => {
        // When
        serviceManager.getService('1337').listeners['page-title-updated'](new Event(''), 'Dr.');
        // Then
        expect(mockIpcSender.send).toHaveBeenCalledWith('setServiceTitle', {id: '1337', title: 'Dr.'});
      });
      describe('handlePageFaviconUpdated', () => {
        test('Favicons provided, should send setTabFavicon with the last of the provided favicons', () => {
          // When
          serviceManager.getService('1337').listeners['page-favicon-updated'](new Event(''), [
            'https://url-to-favicon/aitana.png',
            'https://url-to-favicon/alex.png'
          ]);
          // Then
          expect(mockIpcSender.send)
            .toHaveBeenCalledWith('setTabFavicon', {id: '1337', favicon: 'https://url-to-favicon/alex.png'});
        });
        test('No favicons provided, should send setTabFavicon with the last of the extracted favicons', async () => {
          // Given
          serviceManager.getService('1337').webContents.executeJavaScript = jest.fn(arg => {
            if (arg === 'Array.from(document.querySelectorAll(\'link[rel*="icon"]\')).map(el => el.href)') {
              return ['https://url-to-favicon/julia-128.png', 'https://url-to-favicon/julia.png'];
            }
            return [];
          });
          // When
          await serviceManager.getService('1337').listeners['page-favicon-updated'](new Event(''));
          // Then
          expect(mockIpcSender.send)
            .toHaveBeenCalledWith('setTabFavicon', {id: '1337', favicon: 'https://url-to-favicon/julia.png'});
        });
      });
      test('windowOpen (was new-window)', () => {
        // Given
        serviceManager.getService('1337').webContents.getURL.mockReturnValue('file://tab/index.html');
        // When
        serviceManager.getService('1337').webContents.setWindowOpenHandler.mock.calls[0][0]({url: 'https://example.com'});
        // Then
        expect(require('electron').shell.openExternal).toHaveBeenCalledWith('https://example.com');
      });
    });
  });
  describe('sortServices', () => {
    test('Aborts in case of inconsistency', () => {
      // Given
      jest.spyOn(console, 'error').mockImplementationOnce(() => {});
      // When
      serviceManager.sortServices(['1', '2']);
      // Then
      expect(console.error).toHaveBeenCalledWith('Inconsistent service state, skipping sort operation (2 !== 0).');
    });
    test('Sorts services with new order', () => {
      // Given
      serviceManager.addServices({send: jest.fn()})([{id: 'A1337', url: 'https://localhost'}, {id: 'B31337', url: 'https://example.com'}]);
      // When
      serviceManager.sortServices(['B31337', 'A1337']);
      // Then
      expect(serviceManager.getServiceAt(1)).toBe('B31337');
      expect(serviceManager.getServiceAt(2)).toBe('A1337');
    });
  });
  describe('activeService', () => {
    test('setActiveService/getActiveService, should set/return currently active service', () => {
      // Given
      expect(serviceManager.getActiveService()).toBeNull();
      serviceManager.setActiveService('1337');
      // When
      const result = serviceManager.getActiveService();
      // Then
      expect(result).toBe('1337');
    });
  });
  describe('removeAll', () => {
    test('No tabs, should do nothing', () => {
      // When
      serviceManager.removeAll();
      // Then
      expect(electron.WebContentsView.mock.result).toBeUndefined();
    });
    test('Existing tabs, should delete all tabs entries and destroy their Views', () => {
      // Given
      serviceManager.addServices({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
      // When
      serviceManager.removeAll();
      // Then
      expect(electron.WebContentsView.mock.results[0].value.webContents.destroy).toHaveBeenCalledTimes(1);
    });
  });
  describe('canNotify', () => {
    test('Global notifications enabled, Notifications for this tab enabled, should return true', () => {
      // Given
      settings.updateSettings({
        tabs: [{id: '1337', disableNotifications: false}],
        disableNotificationsGlobally: false
      });
      // When
      const result = serviceManager.canNotify('1337');
      // Then
      expect(result).toBe(true);
    });
    test('Global notifications disabled, Notifications for this tab enabled, should return false', () => {
      // Given
      settings.updateSettings({
        tabs: [{id: '1337', disableNotifications: false}],
        disableNotificationsGlobally: true
      });
      // When
      const result = serviceManager.canNotify('1337');
      // Then
      expect(result).toBe(false);
    });
    test('Global notifications enabled, Notifications for this tab disabled, should return false', () => {
      // Given
      settings.updateSettings({
        tabs: [{id: '1337', disableNotifications: true}],
        disableNotificationsGlobally: false
      });
      // When
      const result = serviceManager.canNotify('1337');
      // Then
      expect(result).toBe(false);
    });
    test('Notifications undefined in settings, should return true (Opt-out setting)', () => {
      // Given
      settings.updateSettings({
        tabs: [{id: '1337'}],
        // eslint-disable-next-line no-undefined
        disableNotificationsGlobally: undefined
      });
      // When
      const result = serviceManager.canNotify('1337');
      // Then
      expect(result).toBe(true);
    });
  });
});
