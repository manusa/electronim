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
describe('Spell-check module test suite', () => {
  let mockBrowserWindow;
  let mockIpc;
  let mockSettings;
  let spellCheck;
  beforeEach(() => {
    jest.resetModules();
    mockBrowserWindow = require('../../__tests__').mockBrowserWindowInstance();
    mockIpc = {
      handle: jest.fn(),
      removeHandler: jest.fn()
    };
    mockSettings = {
      enabledDictionaries: []
    };
    jest.mock('electron', () => ({
      BrowserWindow: jest.fn(() => mockBrowserWindow),
      ipcMain: mockIpc,
      MenuItem: jest.fn(({label, click}) => ({label, click}))
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
  describe('loadDictionaries', () => {
    test('should destroy existing previous fakeRenderer', () => {
      // Given
      spellCheck.loadDictionaries();
      // When
      spellCheck.loadDictionaries();
      // Then
      expect(mockBrowserWindow.destroy).toHaveBeenCalledTimes(1);
    });
    test('should not destroy non-existing previous fakeRenderer', () => {
      // When
      spellCheck.loadDictionaries();
      // Then
      expect(mockBrowserWindow.destroy).not.toHaveBeenCalled();
    });
    test('should remove and then add handler', () => {
      // When
      spellCheck.loadDictionaries();
      // Then
      expect(mockIpc.handle).toHaveBeenCalledAfter(mockIpc.removeHandler);
    });
    test('should remove dictionaryGetMisspelled handler', () => {
      // When
      spellCheck.loadDictionaries();
      // Then
      expect(mockIpc.removeHandler).toHaveBeenCalledWith('dictionaryGetMisspelled');
    });
    test('should handle dictionaryGetMisspelled', () => {
      // When
      spellCheck.loadDictionaries();
      // Then
      expect(mockIpc.handle).toHaveBeenCalledWith('dictionaryGetMisspelled', expect.any(Function));
    });
    test('should load dictionary.renderer URL', () => {
      // When
      spellCheck.loadDictionaries();
      // Then
      expect(mockBrowserWindow.loadURL)
        .toHaveBeenCalledWith(expect.stringMatching(/\/dictionary.renderer\/index.html$/));
    });
  });
  describe('Context Menu handlers', () => {
    let params;
    let webContents;
    beforeEach(() => {
      params = {};
      webContents = {};
      mockBrowserWindow.webContents = webContents;
      spellCheck.loadDictionaries();
    });
    describe('contextMenuHandler', () => {
      test('with no misspelled word, should return empty array', async () => {
        // When
        const result = await spellCheck.contextMenuHandler({}, params, webContents);
        // Then
        expect(result).toEqual([]);
      });
      describe('with misspelled word', () => {
        beforeEach(() => {
          params.misspelledWord = 'the-word';
        });
        test('and no suggestions, should return empty array', async () => {
          // Given
          mockBrowserWindow.webContents.executeJavaScript = jest.fn(async () => []);
          // When
          const result = await spellCheck.contextMenuHandler({}, params, webContents);
          // Then
          expect(result).toEqual([]);
        });
        test('and suggestions, should return array of MenuItems', async () => {
          // Given
          mockBrowserWindow.webContents.executeJavaScript = jest.fn(async () => ['the-suggestion']);
          // When
          const result = await spellCheck.contextMenuHandler({}, params, webContents);
          // Then
          expect(result).toEqual([
            expect.objectContaining({label: 'the-suggestion'})
          ]);
        });
      });
    });
    describe('contextMenuNativeHandler', () => {
      test('with no misspelled word, should return empty array', () => {
        // When
        const result = spellCheck.contextMenuNativeHandler({}, params, webContents);
        // Then
        expect(result).toEqual([]);
      });
      describe('with misspelled word', () => {
        beforeEach(() => {
          params.misspelledWord = 'the-word';
        });
        test('and no suggestions, should return empty array', () => {
          // When
          const result = spellCheck.contextMenuNativeHandler({}, params, webContents);
          // Then
          expect(result).toEqual([]);
        });
        test('and suggestions, should return array of MenuItems', async () => {
          // Given
          params.dictionarySuggestions = ['the-suggestion'];
          // When
          const result = spellCheck.contextMenuNativeHandler({}, params, webContents);
          // Then
          expect(result).toEqual([
            expect.objectContaining({label: 'the-suggestion'})
          ]);
        });
      });
    });
  });
});
