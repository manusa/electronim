describe('Tab Manager module test suite', () => {
  let mockBrowserView;
  let tabManager;
  beforeEach(() => {
    mockBrowserView = {
      setAutoResize: jest.fn(),
      webContents: {
        on: jest.fn(),
        loadURL: jest.fn(),
        getUserAgent: jest.fn(() => 'Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) ElectronIM/13.337.0 Chrome/79.0.1337.79 Electron/0.0.99 Safari/537.36'),
        setUserAgent: jest.fn()
      }
    };
    jest.resetModules();
    jest.mock('electron', () => ({
      BrowserView: jest.fn(() => mockBrowserView)
    }));
    jest.mock('../../settings', () => ({
    }));
    jest.mock('../../spell-check', () => ({
    }));
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
  });
  describe('addTab', () => {
    test('cleanUserAgent, should remove non-standard tokens from user-agent header', () => {
      // Given
      tabManager.addTabs({send: jest.fn()})([{id: 1337, url: 'https://localhost'}]);
      // When
      const result = tabManager.getTab(1337).webContents.setUserAgent;
      // Then
      expect(result).toHaveBeenCalledWith('Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) Chrome/79.0.1337.79 Safari/537.36');
    });
  });
});
