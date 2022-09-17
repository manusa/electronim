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
/* eslint-disable no-use-before-define */
describe('Settings module test suite', () => {
  let mockBrowserView;
  let fs;
  let path;
  let settings;
  beforeEach(() => {
    jest.resetModules();
    mockBrowserView = {
      setAutoResize: jest.fn(),
      setBounds: jest.fn(),
      webContents: {
        on: jest.fn(),
        loadURL: jest.fn()
      }
    };
    jest.mock('electron', () => ({
      BrowserView: jest.fn(() => mockBrowserView)
    }));
    jest.mock('fs');
    jest.mock('os', () => ({homedir: () => '$HOME'}));
    fs = require('fs');
    path = require('path');
    jest.spyOn(path, 'join');
    settings = require('../');
  });
  describe('loadSettings', () => {
    test('settings not exist, should return default settings', () => {
      // Given
      fs.existsSync.mockImplementationOnce(() => false);
      // When
      const result = settings.loadSettings();
      // Then
      expectHomeDirectoryCreated();
      expect(fs.readFileSync).not.toHaveBeenCalled();
      expect(result.tabs).toEqual([]);
      expect(result.enabledDictionaries).toEqual(['en-US']);
    });
    test('settings (empty) exist, should load settings from file system and merge with defaults', () => {
      // Given
      fs.existsSync.mockImplementationOnce(() => true);
      fs.readFileSync.mockImplementationOnce(() => '{}');
      // When
      const result = settings.loadSettings();
      // Then
      expectHomeDirectoryCreated();
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
      expect(fs.readFileSync).toHaveBeenCalledWith(path.join('$HOME', '.electronim', 'settings.json'));
      expect(result.tabs).toEqual([]);
      expect(result.enabledDictionaries).toEqual(['en-US']);
    });
    test('settings exist, should load settings from file system and merge with defaults', () => {
      // Given
      fs.existsSync.mockImplementationOnce(() => true);
      fs.readFileSync.mockImplementationOnce(() => '{"tabs": [{"id": "1"}], "activeTab": "1", "otherSetting": 1337}');
      // When
      const result = settings.loadSettings();
      // Then
      expectHomeDirectoryCreated();
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
      expect(fs.readFileSync).toHaveBeenCalledWith(path.join('$HOME', '.electronim', 'settings.json'));
      expect(result.tabs).toEqual([{id: '1'}]);
      expect(result.enabledDictionaries).toEqual(['en-US']);
      expect(result.activeTab).toBe('1');
      expect(result.otherSetting).toBe(1337);
    });
    test('settings exist disabled tab as active, should load settings from file and ensure active tab is enabled', () => {
      // Given
      fs.existsSync.mockImplementationOnce(() => true);
      fs.readFileSync.mockImplementationOnce(() => '{"tabs": [{"id": "1", "disabled": true}, {"id": "2"}], "activeTab": "1"}');
      // When
      const result = settings.loadSettings();
      // Then
      expect(result.tabs).toEqual([{id: '1', disabled: true}, {id: '2'}]);
      expect(result.activeTab).toBe('2');
    });
  });
  describe('updateSettings', () => {
    test('empty object and NO saved settings, should write default settings', () => {
      // Given
      fs.existsSync.mockImplementationOnce(() => false);
      // When
      settings.updateSettings({});
      // Then
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(fs.writeFileSync).toHaveBeenCalledWith(path.join('$HOME', '.electronim', 'settings.json'),
        '{\n  "tabs": [],\n  "useNativeSpellChecker": false,\n  "enabledDictionaries": [\n    "en-US"\n  ]\n}');
    });
    test('object and saved settings, should overwrite overlapping settings', () => {
      // Given
      fs.existsSync.mockImplementationOnce(() => false);
      // When
      settings.updateSettings({tabs: [{id: 1337}], activeTab: 1337, otherSetting: '1337'});
      // Then
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(fs.writeFileSync).toHaveBeenCalledWith(path.join('$HOME', '.electronim', 'settings.json'),
        '{\n  "tabs": [\n    {\n      "id": 1337\n    }\n  ],\n' +
        '  "useNativeSpellChecker": false,\n' +
        '  "enabledDictionaries": [\n    "en-US"\n  ],\n' +
        '  "activeTab": 1337,\n  "otherSetting": "1337"\n}');
    });
    test('object and saved settings with activeTab removed, should update activeTab', () => {
      // Given
      fs.existsSync.mockImplementationOnce(() => false);
      // When
      settings.updateSettings({tabs: [{id: 1337}], activeTab: 31337});
      // Then
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(fs.writeFileSync).toHaveBeenCalledWith(path.join('$HOME', '.electronim', 'settings.json'),
        '{\n  "tabs": [\n    {\n      "id": 1337\n    }\n  ],\n' +
        '  "useNativeSpellChecker": false,\n' +
        '  "enabledDictionaries": [\n    "en-US"\n  ],\n' +
        '  "activeTab": 1337\n}');
    });
  });
  describe('openSettingsDialog', () => {
    let mainWindow;
    beforeEach(() => {
      mainWindow = {
        getContentBounds: jest.fn(() => ({width: 13, height: 37})),
        setBrowserView: jest.fn()
      };
    });
    test('webPreferences is sandboxed and has no node integration', () => {
      // When
      settings.openSettingsDialog(mainWindow);
      // Then
      const BrowserView = require('electron').BrowserView;
      expect(BrowserView).toHaveBeenCalledTimes(1);
      expect(BrowserView).toHaveBeenCalledWith({
        webPreferences: expect.objectContaining({sandbox: true, nodeIntegration: false})
      });
    });
    test('should load settings URL', () => {
      // When
      settings.openSettingsDialog(mainWindow);
      // Then
      expect(mockBrowserView.webContents.loadURL).toHaveBeenCalledTimes(1);
      expect(mockBrowserView.webContents.loadURL).toHaveBeenCalledWith(expect.stringMatching(/.+?\/index.html$/));
    });
  });
  const expectHomeDirectoryCreated = () => {
    expect(fs.mkdirSync).toHaveBeenCalledTimes(1);
    expect(fs.mkdirSync).toHaveBeenCalledWith(path.join('$HOME', '.electronim'), {recursive: true});
  };
});
