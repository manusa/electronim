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
  let electron;
  let fs;
  let path;
  let settings;
  beforeEach(() => {
    jest.resetModules();
    jest.mock('electron', () => require('../../__tests__').mockElectronInstance());
    electron = require('electron');
    jest.mock('os', () => ({homedir: () => '$HOME'}));
    fs = require('fs');
    jest.spyOn(fs, 'existsSync');
    jest.spyOn(fs, 'readFileSync');
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
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
      expect(fs.readFileSync).toHaveBeenCalled();
      expect(result.tabs).toEqual([]);
      expect(result.enabledDictionaries).toEqual(['en']);
      expect(result.theme).toEqual('system');
    });
    test('settings (empty) exist, should load settings from file system and merge with defaults', () => {
      // Given
      fs.existsSync.mockImplementationOnce(() => true);
      fs.readFileSync.mockImplementationOnce(() => '{}');
      // When
      const result = settings.loadSettings();
      // Then
      expectHomeDirectoryCreated();
      expect(fs.readFileSync).toHaveBeenCalledWith(path.join('$HOME', '.electronim', 'settings.json'));
      expect(result.tabs).toEqual([]);
      expect(result.enabledDictionaries).toEqual(['en']);
      expect(result.theme).toEqual('system');
      expect(result.trayEnabled).toEqual(false);
    });
    test('settings exist, should load settings from file system and merge with defaults', () => {
      // Given
      fs.existsSync.mockImplementationOnce(() => true);
      fs.readFileSync.mockImplementationOnce(() => '{"tabs": [{"id": "1"}], "activeTab": "1", "otherSetting": 1337}');
      // When
      const result = settings.loadSettings();
      // Then
      expectHomeDirectoryCreated();
      expect(fs.readFileSync).toHaveBeenCalledWith(path.join('$HOME', '.electronim', 'settings.json'));
      expect(result.tabs).toEqual([{id: '1'}]);
      expect(result.enabledDictionaries).toEqual(['en']);
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
    test.each([
      {enabledDictionaries: ['en-US', 'es'], expected: ['es', 'en']},
      {enabledDictionaries: ['en-US', 'en', 'es'], expected: ['es', 'en']},
      {enabledDictionaries: ['en-GB', 'en'], expected: ['en-GB', 'en']}
    ])('settings with $enabledDictionaries dictionary, should migrate to $expected', ({enabledDictionaries, expected}) => {
      // Given
      fs.existsSync.mockImplementationOnce(() => true);
      fs.readFileSync.mockImplementationOnce(() => JSON.stringify({enabledDictionaries}));
      // When
      const result = settings.loadSettings();
      // Then
      expect(result.enabledDictionaries).toEqual(expected);
    });
    test.each([
      {key: 'theme', value: '"light"', expected: 'light'},
      {key: 'activeTab', value: 42, expected: 42},
      {key: 'useNativeSpellChecker', value: true, expected: true},
      {key: 'trayEnabled', value: true, expected: true}
    ])('settings with $key, should preserve $key', ({key, value, expected}) => {
      // Given
      fs.existsSync.mockImplementationOnce(() => true);
      fs.readFileSync.mockImplementationOnce(() => `{"${key}": ${value}}`);
      // When
      const result = settings.loadSettings();
      // Then
      expect(result[key]).toBe(expected);
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
        '{\n  "tabs": [],\n' +
        '  "useNativeSpellChecker": false,\n' +
        '  "enabledDictionaries": [\n    "en"\n  ],\n' +
        '  "theme": "system",\n' +
        '  "trayEnabled": false,\n' +
        '  "startMinimized": false,\n' +
        '  "closeButtonBehavior": "quit",\n' +
        '  "keyboardShortcuts": {\n' +
        '    "tabSwitchModifier": "Ctrl",\n' +
        '    "tabTraverseModifier": "Ctrl"\n' +
        '  }\n' +
        '}');
    });
    test('object and saved settings, should overwrite overlapping settings', () => {
      // Given
      fs.existsSync.mockImplementationOnce(() => false);
      // When
      settings.updateSettings({tabs: [{id: 1337}], activeTab: 1337, otherSetting: '1337'});
      // Then
      expect(fs.writeFileSync).toHaveBeenCalledWith(path.join('$HOME', '.electronim', 'settings.json'),
        '{\n  "tabs": [\n    {\n      "id": 1337\n    }\n  ],\n' +
        '  "useNativeSpellChecker": false,\n' +
        '  "enabledDictionaries": [\n    "en"\n  ],\n' +
        '  "theme": "system",\n' +
        '  "trayEnabled": false,\n' +
        '  "startMinimized": false,\n' +
        '  "closeButtonBehavior": "quit",\n' +
        '  "keyboardShortcuts": {\n' +
        '    "tabSwitchModifier": "Ctrl",\n' +
        '    "tabTraverseModifier": "Ctrl"\n' +
        '  },\n' +
        '  "activeTab": 1337,\n' +
        '  "otherSetting": "1337"\n' +
        '}');
    });
    test('object and saved settings with activeTab removed, should update activeTab', () => {
      // Given
      fs.existsSync.mockImplementationOnce(() => false);
      // When
      settings.updateSettings({tabs: [{id: 1337}], activeTab: 31337});
      // Then
      expect(fs.writeFileSync).toHaveBeenCalledWith(path.join('$HOME', '.electronim', 'settings.json'),
        '{\n  "tabs": [\n    {\n      "id": 1337\n    }\n  ],\n' +
        '  "useNativeSpellChecker": false,\n' +
        '  "enabledDictionaries": [\n    "en"\n  ],\n' +
        '  "theme": "system",\n' +
        '  "trayEnabled": false,\n' +
        '  "startMinimized": false,\n' +
        '  "closeButtonBehavior": "quit",\n' +
        '  "keyboardShortcuts": {\n' +
        '    "tabSwitchModifier": "Ctrl",\n' +
        '    "tabTraverseModifier": "Ctrl"\n' +
        '  },\n' +
        '  "activeTab": 1337\n' +
        '}');
    });
  });
  describe('openSettingsDialog', () => {
    let mainWindow;
    let openSettings;
    beforeEach(() => {
      mainWindow = electron.baseWindowInstance;
      mainWindow.getContentBounds = jest.fn(() => ({width: 13, height: 37}));
      openSettings = settings.openSettingsDialog(mainWindow);
    });
    test('webPreferences is sandboxed and has no node integration', () => {
      // When
      openSettings();
      // Then
      const WebContentsView = require('electron').WebContentsView;
      expect(WebContentsView).toHaveBeenCalledTimes(1);
      expect(WebContentsView).toHaveBeenCalledWith({
        webPreferences: expect.objectContaining({sandbox: true, nodeIntegration: false})
      });
    });
    test('should load settings URL', () => {
      // When
      openSettings();
      // Then
      expect(electron.webContentsViewInstance.webContents.loadURL).toHaveBeenCalledTimes(1);
      expect(electron.webContentsViewInstance.webContents.loadURL)
        .toHaveBeenCalledWith(expect.stringMatching(/.+?\/index.html$/));
    });
  });
  describe('exportSettings', () => {
    let mainWindow;
    beforeEach(() => {
      mainWindow = electron.baseWindowInstance;
      fs.writeFileSync.mockClear();
    });
    test('canceled export, should return canceled result', async () => {
      // Given
      electron.dialog.showSaveDialog.mockImplementationOnce(() => ({canceled: true}));
      // When
      const result = await settings.exportSettings(mainWindow)();
      // Then
      expect(result).toEqual({success: false, canceled: true});
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
    test('successful export, should write settings to file', async () => {
      // Given
      const filePath = '/home/user/my-settings.json';
      fs.existsSync.mockImplementationOnce(() => true);
      fs.readFileSync.mockImplementationOnce(() => '{"tabs": [{"id": "1"}], "theme": "dark"}');
      electron.dialog.showSaveDialog.mockImplementationOnce(() => ({canceled: false, filePath}));
      // When
      const result = await settings.exportSettings(mainWindow)();
      // Then
      expect(result).toEqual({success: true, filePath});
      expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, expect.stringContaining('"tabs"'));
      expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, expect.stringContaining('"theme": "dark"'));
    });
  });
  describe('importSettings', () => {
    let mainWindow;
    let eventBusOnSettingsSave;
    beforeEach(() => {
      mainWindow = electron.baseWindowInstance;
      eventBusOnSettingsSave = jest.fn();
      electron.ipcMain.on('settingsSave', eventBusOnSettingsSave);

      fs.writeFileSync.mockClear();
    });
    test('canceled import prompt, should return canceled result', async () => {
      // Given - user cancels the confirmation dialog
      electron.dialog.showMessageBox.mockImplementationOnce(() => ({response: 0})); // Cancel
      // When
      const result = await settings.importSettings(mainWindow)();
      // Then
      expect(result).toEqual({success: false, canceled: true});
      expect(electron.dialog.showOpenDialog).not.toHaveBeenCalled();
    });
    test('canceled file dialog, should return canceled result', async () => {
      // Given - user confirms import but cancels file dialog
      electron.dialog.showMessageBox.mockImplementationOnce(() => ({response: 1})); // Import
      electron.dialog.showOpenDialog.mockImplementationOnce(() => ({canceled: true}));
      // When
      const result = await settings.importSettings(mainWindow)();
      // Then
      expect(result).toEqual({success: false, canceled: true});
    });
    test('empty JSON file, should return error result', async () => {
      // Given
      const filePath = '/home/user/import-settings.json';
      electron.dialog.showMessageBox.mockImplementationOnce(() => ({response: 1})); // Import
      electron.dialog.showOpenDialog.mockImplementationOnce(() => ({
        canceled: false,
        filePaths: [filePath]
      }));
      fs.readFileSync.mockImplementationOnce(() => '');
      // When
      const result = await settings.importSettings(mainWindow)();
      // Then
      expect(result).toEqual({success: false, error: 'Unexpected end of JSON input'});
    });
    test('invalid JSON file, should return error result', async () => {
      // Given
      const filePath = '/home/user/import-settings.json';
      electron.dialog.showMessageBox.mockImplementationOnce(() => ({response: 1})); // Import
      electron.dialog.showOpenDialog.mockImplementationOnce(() => ({
        canceled: false,
        filePaths: [filePath]
      }));
      fs.readFileSync.mockImplementationOnce(() => '{invalid json');
      // When
      const result = await settings.importSettings(mainWindow)();
      // Then
      expect(result).toEqual({success: false, error: expect.stringContaining('Expected property name or \'}\' in JSON at position 1')});
    });
    test('incompatible JSON file, should return error result', async () => {
      // Given
      const filePath = '/home/user/import-settings.json';
      const importedData = '""';
      electron.dialog.showMessageBox.mockImplementationOnce(() => ({response: 1})); // Import
      electron.dialog.showOpenDialog.mockImplementationOnce(() => ({
        canceled: false,
        filePaths: [filePath]
      }));
      fs.readFileSync.mockImplementationOnce(() => importedData);
      // When
      const result = await settings.importSettings(mainWindow)();
      // Then
      expect(result).toEqual({success: false, error: 'Invalid settings file format'});
    });
    describe('successful import', () => {
      beforeEach(async () => {
        const filePath = '/home/user/import-settings.json';
        const importedData = '{"tabs": [{"id": "imported"}], "theme": "light"}';
        electron.dialog.showMessageBox.mockImplementationOnce(() => ({response: 1})); // Import
        electron.dialog.showOpenDialog.mockImplementationOnce(() => ({
          canceled: false,
          filePaths: [filePath]
        }));
        fs.readFileSync.mockImplementationOnce(() => importedData);
        fs.existsSync.mockImplementationOnce(() => false); // For updateSettings call
        // When
        await settings.importSettings(mainWindow)();
      });
      test('reads settings from provided directory', async () => {
        expect(fs.readFileSync).toHaveBeenCalledWith('/home/user/import-settings.json', 'utf8');
      });
      test('emits settingsSaved event with provided settings', async () => {
        expect(eventBusOnSettingsSave).toHaveBeenCalledWith(null, expect.objectContaining({
          tabs: [{id: 'imported'}],
          theme: 'light'
        }));
      });
    });
  });
  describe('openElectronimFolder', () => {
    beforeEach(() => {
      electron.shell.openPath.mockClear();
    });
    test('successful open, should call shell.openPath with app directory', async () => {
      // Given
      electron.shell.openPath.mockImplementationOnce(() => Promise.resolve());
      // When
      const result = await settings.openElectronimFolder();
      // Then
      expect(result).toEqual({success: true, path: path.join('$HOME', '.electronim')});
      expect(electron.shell.openPath).toHaveBeenCalledWith(path.join('$HOME', '.electronim'));
    });
    test('failed open, should return error result', async () => {
      // Given
      const error = new Error('Unable to open path');
      electron.shell.openPath.mockImplementationOnce(() => Promise.reject(error));
      // When
      const result = await settings.openElectronimFolder();
      // Then
      expect(result).toEqual({success: false, error: 'Unable to open path'});
    });
  });
  const expectHomeDirectoryCreated = () => {
    expect(fs.mkdirSync).toHaveBeenCalledWith(path.join('$HOME', '.electronim'), {recursive: true});
  };
});
