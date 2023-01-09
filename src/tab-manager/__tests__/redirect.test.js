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
    jest.mock('electron', () => require('../../__tests__').mockElectronInstance());
    mockBrowserView = require('electron').browserViewInstance;
    mockBrowserView.webContents.getURL.mockImplementation(() => mockBrowserViewUrl);
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
    test.each([
      'https://app.slack.com/client/ID1337',
      'https://files.slack.com/files-pri/ID123/download/image.png?origin_team=ID456'
    ])('URLs handled internally -isHandledInternally- (%s) , should return false', url => {
      // When
      const result = redirect.shouldOpenInExternalBrowser(mockBrowserView, new URL(url));
      // Then
      expect(result).toBe(false);
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
    describe('GoDaddy OAuth', () => {
      describe('godaddy.com', () => {
        test('From OAuth to Slack, should return false', () => {
          // Given
          mockBrowserViewUrl = 'https://sso.godaddy.com/';
          // When
          const result = redirect.shouldOpenInExternalBrowser(mockBrowserView, new URL('https://a-and-a.slack.com'));
          // Then
          expect(result).toBe(false);
        });
        test('From Slack to OAuth, should return false', () => {
          // Given
          mockBrowserViewUrl = 'https://a-and-a.slack.com';
          // When
          const result = redirect.shouldOpenInExternalBrowser(mockBrowserView, new URL('https://sso.godaddy.com'));
          // Then
          expect(result).toBe(false);
        });
      });
      describe('secureserver.net', () => {
        test('From OAuth to Slack, should return false', () => {
          // Given
          mockBrowserViewUrl = 'https://sso.secureserver.net/';
          // When
          const result = redirect.shouldOpenInExternalBrowser(mockBrowserView, new URL('https://julia.slack.com'));
          // Then
          expect(result).toBe(false);
        });
        test('From Slack to OAuth, should return false', () => {
          // Given
          mockBrowserViewUrl = 'https://julia.slack.com';
          // When
          const result = redirect.shouldOpenInExternalBrowser(mockBrowserView, new URL('https://sso.secureserver.net/'));
          // Then
          expect(result).toBe(false);
        });
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
    describe('Twitter login', () => {
      test('From Tweet Deck to Twitter, should return false', () => {
        // Given
        mockBrowserViewUrl = 'https://tweetdeck.twitter.com';
        // When
        const result = redirect.shouldOpenInExternalBrowser(mockBrowserView, new URL('https://mobile.twitter.com/login?hide_message=true&redirect_after_login=https%3A%2F%2Ftweetdeck.twitter.com%2F%3Fvia_twitter_login%3Dtrue'));
        // Then
        expect(result).toBe(false);
      });
      test('From Twitter to Tweet Deck , should return false', () => {
        // Given
        mockBrowserViewUrl = 'https://mobile.twitter.com/login';
        // When
        const result = redirect.shouldOpenInExternalBrowser(mockBrowserView, new URL('https://tweetdeck.twitter.com?via_twitter_login=true'));
        // Then
        expect(result).toBe(false);
      });
      test('From Tweet Deck to logout, should return false', () => {
        // Given
        mockBrowserViewUrl = 'https://tweetdeck.twitter.com';
        // When
        const result = redirect.shouldOpenInExternalBrowser(mockBrowserView, new URL('https://mobile.twitter.com/logout'));
        // Then
        expect(result).toBe(false);
      });
    });
    describe('Zoho login', () => {
      test('From Zoho mail to login, should return false', () => {
        // Given
        mockBrowserViewUrl = 'https://mail.zoho.com';
        // When
        const result = redirect.shouldOpenInExternalBrowser(mockBrowserView, new URL('https://accounts.zoho.com/signin?servicename&serviceurl=https://mail.zoho.com'));
        // Then
        expect(result).toBe(false);
      });
      test('From Zoho mail to login (eu), should return false', () => {
        // Given
        mockBrowserViewUrl = 'https://mail.zoho.com';
        // When
        const result = redirect.shouldOpenInExternalBrowser(mockBrowserView, new URL('https://accounts.zoho.eu/signin?servicename&serviceurl=https://mail.zoho.eu'));
        // Then
        expect(result).toBe(false);
      });
    });
    describe('Zoom login', () => {
      test('From Zoom home to login (profile), should return false', () => {
        // Given
        mockBrowserViewUrl = 'https://zoom.us/signin';
        // When
        const result = redirect.shouldOpenInExternalBrowser(mockBrowserView, new URL('https://us04web.zoom.us/profile'));
        // Then
        expect(result).toBe(false);
      });
      test('From Zoom home to one time password (OTP), should return false', () => {
        // Given
        mockBrowserViewUrl = 'https://zoom.us/signin';
        // When
        const result = redirect.shouldOpenInExternalBrowser(mockBrowserView, new URL('https://us04web.zoom.us/signin/otp/verify_help'));
        // Then
        expect(result).toBe(false);
      });
    });
  });
  describe('handleRedirect', () => {
    let event;
    beforeEach(() => {
      event = {preventDefault: jest.fn()};
    });
    describe('different origin and not handled', () => {
      beforeEach(() => {
        redirect.handleRedirect(mockBrowserView)(event, 'https://example.com/site-page');
      });
      test('should prevent default', () => {
        expect(event.preventDefault).toHaveBeenCalled();
      });
      test('should open window in external browser', () => {
        expect(require('electron').shell.openExternal).toHaveBeenCalledWith('https://example.com/site-page');
      });
    });
  });
  describe('windowOpenHandler', () => {
    test('same origin, opens window in Electron popup', () => {
      // When
      const result = redirect.windowOpenHandler(mockBrowserView)({url: 'http://localhost/terms-and-conditions'});
      // Then
      expect(result).toEqual({action: 'allow'});
    });
    test('handled oauth, opens window in Electron popup', () => {
      // When
      const result = redirect.windowOpenHandler(mockBrowserView)({url: 'https://accounts.google.com/o/oauth2/auth'});
      // Then
      expect(result).toEqual({action: 'allow'});
    });
    test('handled internally, opens window in Electron popup', () => {
      // When
      const result = redirect.windowOpenHandler(mockBrowserView)({url: 'https://files.slack.com/files-pri/ID123/download/image.png?origin_team=ID456'});
      // Then
      expect(result).toEqual({action: 'allow'});
    });
    test('different origin and not handled, opens window in external browser', () => {
      // When
      const result = redirect.windowOpenHandler(mockBrowserView)({url: 'https://example.com/site-page'});
      // Then
      expect(require('electron').shell.openExternal).toHaveBeenCalledWith('https://example.com/site-page');
      expect(result).toEqual({action: 'deny'});
    });
  });
});
