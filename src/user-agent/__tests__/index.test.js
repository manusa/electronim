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
describe('User Agent module test suite', () => {
  let axios;
  let userAgent;
  beforeEach(() => {
    jest.resetModules();
    jest.mock('axios');
    axios = require('axios');
    userAgent = require('../index');
  });
  describe('initBrowserVersions', () => {
    test('valid responses, should return a valid version for all browsers,', async () => {
      // Given
      axios.get.mockImplementationOnce(async () => ({data: [
        {os: 'linux', versions: [{channel: 'other', version: '5uck5'}, {channel: 'stable', version: '1337'}]},
        {os: 'win'}
      ]}));
      axios.get.mockImplementation(async () => ({data: {
        FIREFOX_DEVEDITION: '313373',
        LATEST_FIREFOX_VERSION: 'ff.1337',
        FIREFOX_ESR: 'ff.1337.esr'
      }}));
      // When
      await userAgent.initBrowserVersions();
      // Then
      expect(userAgent.BROWSER_VERSIONS.chromium).toBe('1337');
      expect(userAgent.BROWSER_VERSIONS.firefox).toBe('ff.1337');
      expect(userAgent.BROWSER_VERSIONS.firefoxESR).toBe('ff.1337.esr');
    });
    test('invalidResponse, should return null,', async () => {
      // Given
      axios.get.mockImplementation(async () => ({data: [
        {os: 'win'}, 'not Valid'
      ]}));
      // When
      await userAgent.initBrowserVersions();
      // Then
      expect(userAgent.BROWSER_VERSIONS.chromium).toBeNull();
      expect(userAgent.BROWSER_VERSIONS.firefox).toBeNull();
    });
  });
  describe('userAgentForView', () => {
    test('default and chromium version not available, should remove non-standard tokens from user-agent header', () => {
      // Given
      userAgent.BROWSER_VERSIONS.chromium = null;
      const browserView = {
        webContents: {
          userAgent: 'Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) ElectronIM/13.337.0 Chrome/79.0.1337.79 Electron/0.0.99 Safari/537.36'
        }
      };
      // When
      const result = userAgent.userAgentForView(browserView);
      // Then
      expect(result).toBe('Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) Chrome/79.0.1337.79 Safari/537.36');
    });
    test('default and chromium version available, should replace Chrome version in user-agent header', () => {
      // Given
      userAgent.BROWSER_VERSIONS.chromium = '1337.1337.1337';
      const browserView = {
        webContents: {
          userAgent: 'Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) ElectronIM/13.337.0 Chrome/79.0.1337.79 Electron/0.0.99 Safari/537.36'
        }
      };
      // When
      const result = userAgent.userAgentForView(browserView);
      // Then
      expect(result).toBe('Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) Chrome/1337.1337.1337 Safari/537.36');
    });
    test('non-matching url provided and chromium version available, should replace Chrome version in user-agent header', () => {
      // Given
      userAgent.BROWSER_VERSIONS.chromium = '1337.1337.1337';
      const browserView = {
        webContents: {
          userAgent: 'Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) ElectronIM/13.337.0 Chrome/79.0.1337.79 Electron/0.0.99 Safari/537.36'
        }
      };
      const nonMatchingUrl = 'https://some-url-com/google.com';
      // When
      const result = userAgent.userAgentForView(browserView, nonMatchingUrl);
      // Then
      expect(result).toBe('Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) Chrome/1337.1337.1337 Safari/537.36');
    });
  });
  describe('addUserAgentInterceptor', () => {
    let session;
    beforeEach(() => {
      session = {
        webRequest: {
          onBeforeSendHeaders: jest.fn()
        }
      };
    });
    test('userAgentInterceptor = true, should return (interceptor only added once)', () => {
      // Given
      session.userAgentInterceptor = true;
      // When
      userAgent.addUserAgentInterceptor(session);
      // Then
      expect(session.webRequest.onBeforeSendHeaders).not.toHaveBeenCalled();
    });
    test('userAgentInterceptor = undefined, should add interceptor', () => {
      // When
      userAgent.addUserAgentInterceptor(session);
      // Then
      expect(session.userAgentInterceptor).toEqual(true);
      expect(session.webRequest.onBeforeSendHeaders).toHaveBeenCalledTimes(1);
    });
    test('onBeforeSendHeaders interceptor,filter', () => {
      // When
      userAgent.addUserAgentInterceptor(session);
      // Then
      expect(session.webRequest.onBeforeSendHeaders.mock.calls[0][0].urls)
        .toEqual(['*://*.google.com/*']);
    });
    test('onBeforeSendHeaders interceptor, with standard URl', () => {
      // Given
      const details = {
        url: 'https://www.example.com',
        requestHeaders: {}
      };
      const callback = jest.fn();
      userAgent.addUserAgentInterceptor(session);
      // When
      session.webRequest.onBeforeSendHeaders.mock.calls[0][1](details, callback);
      // Then
      expect(details.requestHeaders).toBeEmpty();
    });
    describe('onBeforeSendHeaders', () => {
      let details;
      const callback = jest.fn();
      beforeEach(() => {
        userAgent.BROWSER_VERSIONS.firefoxESR = '133.7';
        details = {
          requestHeaders: {
            'User-Agent': 'Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) ElectronIM/13.337.0 Chrome/79.0.1337.79 Electron/0.0.99 Safari/537.36'
          }
        };
        userAgent.addUserAgentInterceptor(session);
      });
      test('onBeforeSendHeaders interceptor, with Google URl', () => {
        // Given
        details.url = 'https://accounts.google.com';
        // When
        session.webRequest.onBeforeSendHeaders.mock.calls[0][1](details, callback);
        // Then
        expect(details.requestHeaders['User-Agent'])
          .toBe('Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:133.7) Gecko/20100101 Firefox/133.7');
      });
      test('onBeforeSendHeaders interceptor, with Google meet URl', () => {
        // Given
        details.url = 'https://meet.google.com';
        // When
        session.webRequest.onBeforeSendHeaders.mock.calls[0][1](details, callback);
        // Then
        expect(details.requestHeaders['User-Agent'])
          .toBe('Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) ElectronIM/13.337.0 Chrome/79.0.1337.79 Electron/0.0.99 Safari/537.36');
      });
      test('onBeforeSendHeaders interceptor, with GMail URl', () => {
        // Given
        details.url = 'https://mail.google.com';
        // When
        session.webRequest.onBeforeSendHeaders.mock.calls[0][1](details, callback);
        // Then
        expect(details.requestHeaders['User-Agent'])
          .toBe('Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) ElectronIM/13.337.0 Chrome/79.0.1337.79 Electron/0.0.99 Safari/537.36');
      });
    });
  });
});
