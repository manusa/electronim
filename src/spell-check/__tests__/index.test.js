describe('Spell-check module test suite', () => {
  let mockBrowserWindow;
  let mockIpc;
  let mockSettings;
  let spellCheck;
  beforeEach(() => {
    mockBrowserWindow = {
      loadURL: jest.fn()
    };
    mockIpc = {
      handle: jest.fn()
    };
    mockSettings = {
      enabledDictionaries: []
    };
    jest.resetModules();
    jest.mock('electron', () => ({
      BrowserWindow: jest.fn(() => mockBrowserWindow),
      ipcMain: mockIpc
    }));
    jest.mock('../../settings', () => ({
      loadSettings: jest.fn(() => mockSettings)
    }));
    spellCheck = require('../');
  });
  test('getEnabledDictionaries, should return persisted enabled dictionaries', () => {
    // Given
    mockSettings.enabledDictionaries = ['13-37'];
    // When
    const result = spellCheck.getEnabledDictionaries();
    // Then
    expect(result).toEqual(['13-37']);
  });
  test('loadDictionaries', () => {
    // When
    spellCheck.loadDictionaries();
    // Then
    expect(mockBrowserWindow.loadURL).toHaveBeenCalledWith(expect.stringMatching(/\/dictionary.renderer\/index.html$/));
    expect(mockIpc.handle).toHaveBeenCalledWith('dictionaryGetMisspelled', expect.any(Function));
  });
});
