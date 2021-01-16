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
describe('Tab Manager Redirect module test suite', () => {
  let redirect;
  let mockBrowserView;
  let mockBrowserViewUrl;
  beforeEach(() => {
    mockBrowserViewUrl = 'http://localhost';
    mockBrowserView = {
      webContents: {getURL: jest.fn(() => mockBrowserViewUrl)}
    };
    redirect = require('../redirect');
  });
  describe('shouldOpenInExternalBrowser', () => {
    describe('External Navigation', () => {
      test('From Slack to external URL, should return true', () => {
        // Given
        mockBrowserViewUrl = 'https://aitana.slack.com';
        // When
        const result = redirect.shouldOpenInExternalBrowser(mockBrowserView, new URL('https://www.external.url.com'));
        // Then
        expect(result).toBe(true);
      });
    });
    describe('Google OAuth', () => {
      test('From OAuth to Slack, should return false', () => {
        // Given
        mockBrowserViewUrl = 'https://acc.google.com/signin/oauth/?redirect=https://slack.com';
        // When
        const result = redirect.shouldOpenInExternalBrowser(mockBrowserView, new URL('https://aitana.slack.com'));
        // Then
        expect(result).toBe(false);
      });
      test('From Slack to OAuth, should return false', () => {
        // Given
        mockBrowserViewUrl = 'https://aitana.slack.com';
        // When
        const result = redirect.shouldOpenInExternalBrowser(mockBrowserView, new URL('https://accounts.google.com/o/oauth2/auth'));
        // Then
        expect(result).toBe(false);
      });
    });
    describe('GitHub OAuth', () => {
      test('From OAuth to Slack, should return false', () => {
        // Given
        mockBrowserViewUrl = 'https://github.com/login/oauth';
        // When
        const result = redirect.shouldOpenInExternalBrowser(mockBrowserView, new URL('https://aitana.slack.com'));
        // Then
        expect(result).toBe(false);
      });
      test('From Slack to OAuth, should return false', () => {
        // Given
        mockBrowserViewUrl = 'https://aitana.slack.com';
        // When
        const result = redirect.shouldOpenInExternalBrowser(mockBrowserView, new URL('https://github.com/login/oauth'));
        // Then
        expect(result).toBe(false);
      });
    });
    describe('Red Hat OAuth', () => {
      test('From Slack to OAuth, should return false', () => {
        // Given
        mockBrowserViewUrl = 'https://alex.slack.com';
        // When
        const result = redirect.shouldOpenInExternalBrowser(mockBrowserView,
          new URL('https://auth.redhat.com/auth/realms/EmployeeIDP/login-actions/authenticate?execution=1337'));
        // Then
        expect(result).toBe(false);
      });
    });
    describe('Skype OAuth', () => {
      test('From Skype to OAuth, should return false', () => {
        // Given
        mockBrowserViewUrl = 'https://web.skype.com';
        // When
        const result = redirect.shouldOpenInExternalBrowser(mockBrowserView,
          new URL('https://login.skype.com/login/oauth/microsoft?client_id=313373'));
        // Then
        expect(result).toBe(false);
      });
      test('From Skype OAuth to Microsoft, should return false', () => {
        // Given
        mockBrowserViewUrl = 'https://web.skype.com';
        // When
        const result = redirect.shouldOpenInExternalBrowser(mockBrowserView,
          new URL('https://login.live.com/login.srf?wa=wsignin1.0&rpsnv=13&ct=1610780563'));
        // Then
        expect(result).toBe(false);
      });
    });
    describe('Teams OAuth', () => {
      test('From Teams to Microsoft Online, should return false', () => {
        // Given
        mockBrowserViewUrl = 'https://teams.microsoft.com';
        // When
        const result = redirect.shouldOpenInExternalBrowser(mockBrowserView,
          new URL('https://login.microsoftonline.com/common/oauth2/authorize?response_type=id_token'));
        // Then
        expect(result).toBe(false);
      });
      test('From Teams to Microsoft Login, should return false', () => {
        // Given
        mockBrowserViewUrl = 'https://teams.microsoft.com';
        // When
        const result = redirect.shouldOpenInExternalBrowser(mockBrowserView,
          new URL('https://login.live.com/Me.htm?v=3'));
        // Then
        expect(result).toBe(false);
      });
    });
  });
});
