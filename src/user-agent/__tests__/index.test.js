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
const {testUserAgent} = require('../../__tests__');

describe('User Agent module test suite', () => {
  let userAgent;

  describe('initBrowserVersions', () => {
    test('valid responses, should return a valid version for all browsers', async () => {
      // Given
      userAgent = await testUserAgent({
        chromiumResponse: {
          releases: [
            {name: 'chrome/platforms/linux/channels/stable/versions/1337/releases/1704308709', version: '1337'},
            {name: 'chrome/platforms/linux/channels/stable/versions/1336/releases/1704308708', version: '1336'}
          ]
        },
        firefoxResponse: {
          FIREFOX_DEVEDITION: '313373',
          LATEST_FIREFOX_VERSION: 'ff.1337',
          FIREFOX_ESR: 'ff.1337.esr'
        }
      });
      // When
      await userAgent.initBrowserVersions();
      // Then
      expect(userAgent.BROWSER_VERSIONS.chromium).toBe('1337');
      expect(userAgent.BROWSER_VERSIONS.firefox).toBe('ff.1337');
      expect(userAgent.BROWSER_VERSIONS.firefoxESR).toBe('ff.1337.esr');
    });
    test('invalid response, should return null', async () => {
      // Given
      userAgent = await testUserAgent({
        chromiumResponse: {
          releases: [
            {os: 'win'}, 'not Valid'
          ]
        },
        firefoxResponse: {}
      });
      // When
      await userAgent.initBrowserVersions();
      // Then
      expect(userAgent.BROWSER_VERSIONS.chromium).toBeNull();
      expect(userAgent.BROWSER_VERSIONS.firefox).toBeNull();
    });
  });
  describe('userAgentForWebContents', () => {
    beforeEach(async () => {
      userAgent = await testUserAgent();
    });
    test('default and chromium version not available, should remove non-standard tokens from user-agent header', () => {
      // Given
      userAgent.BROWSER_VERSIONS.chromium = null;
      const webContents = {
        userAgent: 'Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) ElectronIM/13.337.0 Chrome/79.0.1337.79 Electron/0.0.99 Safari/537.36'
      };
      // When
      const result = userAgent.userAgentForWebContents(webContents);
      // Then
      expect(result).toBe('Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) Chrome/79.0.1337.79 Safari/537.36');
    });
    test('default and chromium version available, should replace Chrome version in user-agent header', () => {
      // Given
      userAgent.BROWSER_VERSIONS.chromium = '1337.1337.1337';
      const webContents = {
        userAgent: 'Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) ElectronIM/13.337.0 Chrome/79.0.1337.79 Electron/0.0.99 Safari/537.36'
      };
      // When
      const result = userAgent.userAgentForWebContents(webContents);
      // Then
      expect(result).toBe('Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) Chrome/1337.1337.1337 Safari/537.36');
    });
    test('non-matching url provided and chromium version available, should replace Chrome version in user-agent header', () => {
      // Given
      userAgent.BROWSER_VERSIONS.chromium = '1337.1337.1337';
      const webContents = {
        userAgent: 'Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) ElectronIM/13.337.0 Chrome/79.0.1337.79 Electron/0.0.99 Safari/537.36'
      };
      const nonMatchingUrl = 'https://some-url-com/google.com';
      // When
      const result = userAgent.userAgentForWebContents(webContents, nonMatchingUrl);
      // Then
      expect(result).toBe('Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) Chrome/1337.1337.1337 Safari/537.36');
    });
  });
  describe('chromeUserAgent', () => {
    let originalPlatform;
    let originalChromeVersion;
    beforeEach(async () => {
      userAgent = await testUserAgent();
      originalPlatform = process.platform;
      originalChromeVersion = process.versions.chrome;
      process.versions.chrome = '133.0.6920.0';
    });
    afterEach(() => {
      Object.defineProperty(process, 'platform', {value: originalPlatform});
      process.versions.chrome = originalChromeVersion;
    });
    test('should return macOS Chrome user agent on darwin', () => {
      // Given
      Object.defineProperty(process, 'platform', {value: 'darwin'});
      // When
      const result = userAgent.chromeUserAgent();
      // Then
      expect(result).toBe('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36');
    });
    test('should return Windows Chrome user agent on win32', () => {
      // Given
      Object.defineProperty(process, 'platform', {value: 'win32'});
      // When
      const result = userAgent.chromeUserAgent();
      // Then
      expect(result).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36');
    });
    test('should return Linux Chrome user agent on linux', () => {
      // Given
      Object.defineProperty(process, 'platform', {value: 'linux'});
      // When
      const result = userAgent.chromeUserAgent();
      // Then
      expect(result).toBe('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36');
    });
    test('should use major version from process.versions.chrome formatted as X.0.0.0', () => {
      // Given
      process.versions.chrome = '142.0.7444.59';
      // When
      const result = userAgent.chromeUserAgent();
      // Then
      expect(result).toContain('Chrome/142.0.0.0');
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
