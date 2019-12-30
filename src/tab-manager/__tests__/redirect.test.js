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
  });

});
