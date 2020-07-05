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
    mockBrowserView = {
      loadURL: jest.fn()
    };
    jest.resetModules();
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
      fs.readFileSync.mockImplementationOnce(() => '{"tabs": [{"id": "1"}], "otherSetting": 1337}');
      // When
      const result = settings.loadSettings();
      // Then
      expectHomeDirectoryCreated();
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
      expect(fs.readFileSync).toHaveBeenCalledWith(path.join('$HOME', '.electronim', 'settings.json'));
      expect(result.tabs).toEqual([{id: '1'}]);
      expect(result.enabledDictionaries).toEqual(['en-US']);
      expect(result.otherSetting).toBe(1337);
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
        '{\n  "tabs": [],\n  "enabledDictionaries": [\n    "en-US"\n  ]\n}');
    });
    test('object and saved settings, should overwrite overlapping settings', () => {
      // Given
      fs.existsSync.mockImplementationOnce(() => false);
      // When
      settings.updateSettings({tabs: [{id: 1337}], otherSetting: '1337'});
      // Then
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(fs.writeFileSync).toHaveBeenCalledWith(path.join('$HOME', '.electronim', 'settings.json'),
        '{\n  "tabs": [\n    {\n      "id": 1337\n    }\n  ],\n  "enabledDictionaries": [\n    "en-US"\n  ],\n' +
        '  "otherSetting": "1337"\n}');
    });
  });
  describe('updateTabUrls', () => {
    test('No tab URLs provided and existing tabs, should save empty array', () => {
      // Given
      fs.existsSync.mockImplementation(() => true);
      fs.readFileSync.mockImplementation(
        () => '{"enabledDictionaries":[], "tabs": [{"id": "1", "url": "http://to-be-removed"}]}');
      // When
      settings.updateTabUrls([]);
      // Then
      expect(fs.writeFileSync).toHaveBeenCalledWith(path.join('$HOME', '.electronim', 'settings.json'),
        '{\n  "tabs": [],\n  "enabledDictionaries": []\n}');
    });
    test('New tab URLs provided and existing tabs, should save array with merged tabs', () => {
      // Given
      fs.existsSync.mockImplementation(() => true);
      fs.readFileSync.mockImplementation(
        () => '{"enabledDictionaries":[], "tabs": [{"id": "1", "url": "http://to-be-kept", "otherSetting": 1337}]}');
      // When
      settings.updateTabUrls([
        {id: '1', url: 'http://to-be-kept'},
        {id: '1337', url: 'http://new-tab'}
      ]);
      // Then
      expect(fs.readFileSync).toHaveBeenCalledTimes(3);
      expect(fs.writeFileSync).toHaveBeenCalledWith(path.join('$HOME', '.electronim', 'settings.json'),
        '{\n  "tabs": [\n' +
        '    {\n      "id": "1",\n      "url": "http://to-be-kept",\n      "otherSetting": 1337\n    },\n' +
        '    {\n      "id": "1337",\n      "url": "http://new-tab"\n    }\n  ],\n' +
        '  "enabledDictionaries": []\n}');
    });
  });
  describe('openSettingsDialog', () => {
    test('', () => {
      // Given
      mockBrowserView.setBounds = jest.fn();
      mockBrowserView.setAutoResize = jest.fn();
      mockBrowserView.webContents = {loadURL: jest.fn()};
      const mainWindow = {
        getContentBounds: jest.fn(() => ({width: 13, height: 37})),
        setBrowserView: jest.fn()
      };
      // When
      settings.openSettingsDialog(mainWindow);
      // Then
      expect(mockBrowserView.setBounds).toHaveBeenCalledTimes(1);
      expect(mockBrowserView.setBounds).toHaveBeenCalledWith({x: 0, y: 0, width: 13, height: 37});
      expect(mockBrowserView.setAutoResize).toHaveBeenCalledTimes(1);
      expect(mockBrowserView.setAutoResize)
        .toHaveBeenCalledWith({width: true, horizontal: true, height: true, vertical: true});
      expect(mockBrowserView.webContents.loadURL).toHaveBeenCalledTimes(1);
      expect(mockBrowserView.webContents.loadURL).toHaveBeenCalledWith(expect.stringMatching(/.+?\/index.html$/));
    });
  });
  const expectHomeDirectoryCreated = () => {
    expect(fs.mkdirSync).toHaveBeenCalledTimes(1);
    expect(fs.mkdirSync).toHaveBeenCalledWith(path.join('$HOME', '.electronim'), {recursive: true});
  };
});
