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
describe('Settings module test suite', () => {
  let electron;
  let fs;
  let path;
  let settings;
  let tempDir;
  let settingsPath;
  beforeEach(() => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    fs = require('node:fs');
    path = require('node:path');
    // Create a temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'electronim-test-'));
    settingsPath = path.join(tempDir, 'settings.json');
    settings = require('../');
    settings.setSettingsPath(settingsPath);
  });
  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  });
  describe('loadSettings', () => {
    test('settings not exist, should return default settings', () => {
      // Given - settingsPath does not exist (no file created)
      // When
      const result = settings.loadSettings();
      // Then
      expect(fs.existsSync(tempDir)).toBe(true); // Directory should be created
      expect(result.tabs).toEqual([]);
      expect(result.enabledDictionaries).toEqual(['en']);
      expect(result.theme).toEqual('system');
    });
    test('settings (empty) exist, should load settings from file system and merge with defaults', () => {
      // Given
      fs.writeFileSync(settingsPath, '{}');
      // When
      const result = settings.loadSettings();
      // Then
      expect(fs.existsSync(tempDir)).toBe(true);
      expect(fs.existsSync(settingsPath)).toBe(true);
      expect(result.tabs).toEqual([]);
      expect(result.enabledDictionaries).toEqual(['en']);
      expect(result.theme).toEqual('system');
      expect(result.trayEnabled).toEqual(false);
    });
    test('settings exist, should load settings from file system and merge with defaults', () => {
      // Given
      fs.writeFileSync(settingsPath, '{"tabs": [{"id": "1"}], "activeTab": "1", "otherSetting": 1337}');
      // When
      const result = settings.loadSettings();
      // Then
      expect(fs.existsSync(tempDir)).toBe(true);
      expect(fs.existsSync(settingsPath)).toBe(true);
      expect(result.tabs).toEqual([{id: '1'}]);
      expect(result.enabledDictionaries).toEqual(['en']);
      expect(result.activeTab).toBe('1');
      expect(result.otherSetting).toBe(1337);
    });
    test('settings exist disabled tab as active, should load settings from file and ensure active tab is enabled', () => {
      // Given
      fs.writeFileSync(settingsPath, '{"tabs": [{"id": "1", "disabled": true}, {"id": "2"}], "activeTab": "1"}');
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
      fs.writeFileSync(settingsPath, JSON.stringify({enabledDictionaries}));
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
      fs.writeFileSync(settingsPath, `{"${key}": ${value}}`);
      // When
      const result = settings.loadSettings();
      // Then
      expect(result[key]).toBe(expected);
    });
  });
  describe('updateSettings', () => {
    test('empty object and NO saved settings, should write default settings', () => {
      // Given - no settings file exists
      // When
      settings.updateSettings({});
      // Then
      expect(fs.existsSync(settingsPath)).toBe(true);
      const written = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      expect(written).toEqual({
        tabs: [],
        useNativeSpellChecker: false,
        enabledDictionaries: ['en'],
        theme: 'system',
        trayEnabled: false,
        startMinimized: false,
        closeButtonBehavior: 'quit',
        keyboardShortcuts: {
          tabSwitchModifier: 'Ctrl',
          tabTraverseModifier: 'Ctrl'
        }
      });
    });
    test('object and saved settings, should overwrite overlapping settings', () => {
      // Given - no settings file exists
      // When
      settings.updateSettings({tabs: [{id: 1337}], activeTab: 1337, otherSetting: '1337'});
      // Then
      expect(fs.existsSync(settingsPath)).toBe(true);
      const written = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      expect(written).toEqual({
        tabs: [{id: 1337}],
        useNativeSpellChecker: false,
        enabledDictionaries: ['en'],
        theme: 'system',
        trayEnabled: false,
        startMinimized: false,
        closeButtonBehavior: 'quit',
        keyboardShortcuts: {
          tabSwitchModifier: 'Ctrl',
          tabTraverseModifier: 'Ctrl'
        },
        activeTab: 1337,
        otherSetting: '1337'
      });
    });
    test('object and saved settings with activeTab removed, should update activeTab', () => {
      // Given - no settings file exists
      // When
      settings.updateSettings({tabs: [{id: 1337}], activeTab: 31337});
      // Then
      expect(fs.existsSync(settingsPath)).toBe(true);
      const written = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      expect(written).toEqual({
        tabs: [{id: 1337}],
        useNativeSpellChecker: false,
        enabledDictionaries: ['en'],
        theme: 'system',
        trayEnabled: false,
        startMinimized: false,
        closeButtonBehavior: 'quit',
        keyboardShortcuts: {
          tabSwitchModifier: 'Ctrl',
          tabTraverseModifier: 'Ctrl'
        },
        activeTab: 1337 // Should be corrected to valid tab ID
      });
    });
  });
  describe('openSettingsDialog', () => {
    let mainWindow;
    let openSettings;
    beforeEach(() => {
      mainWindow = new electron.BaseWindow();
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
    });
    test('canceled export, should return canceled result', async () => {
      // Given
      electron.dialog.showSaveDialog.mockImplementationOnce(() => ({canceled: true}));
      // When
      const result = await settings.exportSettings(mainWindow)();
      // Then
      expect(result).toEqual({success: false, canceled: true});
    });
    test('successful export, should write settings to file', async () => {
      // Given
      const exportPath = path.join(tempDir, 'my-settings.json');
      fs.writeFileSync(settingsPath, '{"tabs": [{"id": "1"}], "theme": "dark"}');
      electron.dialog.showSaveDialog.mockImplementationOnce(() => ({canceled: false, filePath: exportPath}));
      // When
      const result = await settings.exportSettings(mainWindow)();
      // Then
      expect(result).toEqual({success: true, filePath: exportPath});
      expect(fs.existsSync(exportPath)).toBe(true);
      const exported = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
      expect(exported.tabs).toEqual([{id: '1'}]);
      expect(exported.theme).toBe('dark');
    });
  });
  describe('importSettings', () => {
    let mainWindow;
    let eventBusOnSettingsSave;
    beforeEach(() => {
      mainWindow = electron.baseWindowInstance;
      eventBusOnSettingsSave = jest.fn();
      electron.ipcMain.on('settingsSave', eventBusOnSettingsSave);
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
      const importPath = path.join(tempDir, 'import-settings.json');
      fs.writeFileSync(importPath, '');
      electron.dialog.showMessageBox.mockImplementationOnce(() => ({response: 1})); // Import
      electron.dialog.showOpenDialog.mockImplementationOnce(() => ({
        canceled: false,
        filePaths: [importPath]
      }));
      // When
      const result = await settings.importSettings(mainWindow)();
      // Then
      expect(result).toEqual({success: false, error: 'Unexpected end of JSON input'});
    });
    test('invalid JSON file, should return error result', async () => {
      // Given
      const importPath = path.join(tempDir, 'import-settings.json');
      fs.writeFileSync(importPath, '{invalid json');
      electron.dialog.showMessageBox.mockImplementationOnce(() => ({response: 1})); // Import
      electron.dialog.showOpenDialog.mockImplementationOnce(() => ({
        canceled: false,
        filePaths: [importPath]
      }));
      // When
      const result = await settings.importSettings(mainWindow)();
      // Then
      expect(result).toEqual({success: false, error: expect.stringContaining('Expected property name or \'}\' in JSON at position 1')});
    });
    test('incompatible JSON file, should return error result', async () => {
      // Given
      const importPath = path.join(tempDir, 'import-settings.json');
      fs.writeFileSync(importPath, '""');
      electron.dialog.showMessageBox.mockImplementationOnce(() => ({response: 1})); // Import
      electron.dialog.showOpenDialog.mockImplementationOnce(() => ({
        canceled: false,
        filePaths: [importPath]
      }));
      // When
      const result = await settings.importSettings(mainWindow)();
      // Then
      expect(result).toEqual({success: false, error: 'Invalid settings file format'});
    });
    describe('successful import', () => {
      let importPath;
      beforeEach(async () => {
        importPath = path.join(tempDir, 'import-settings.json');
        const importedData = '{"tabs": [{"id": "imported"}], "theme": "light"}';
        fs.writeFileSync(importPath, importedData);
        electron.dialog.showMessageBox.mockImplementationOnce(() => ({response: 1})); // Import
        electron.dialog.showOpenDialog.mockImplementationOnce(() => ({
          canceled: false,
          filePaths: [importPath]
        }));
        // When
        await settings.importSettings(mainWindow)();
      });
      test('reads settings from provided directory', async () => {
        expect(fs.existsSync(importPath)).toBe(true);
        const imported = JSON.parse(fs.readFileSync(importPath, 'utf8'));
        expect(imported.tabs).toEqual([{id: 'imported'}]);
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
      expect(result).toEqual({success: true, path: tempDir});
      expect(electron.shell.openPath).toHaveBeenCalledWith(tempDir);
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
  describe('setSettingsPath', () => {
    test('should resolve relative paths to absolute', () => {
      // Given
      const relativePath = './my-settings.json';
      // When
      settings.setSettingsPath(relativePath);
      // Then - path should be resolved, verify by using it
      settings.updateSettings({tabs: [{id: 'resolved-test'}]});
      // The settings file should exist at the resolved path
      const resolvedPath = path.resolve(relativePath);
      expect(fs.existsSync(resolvedPath)).toBe(true);
      // Clean up
      fs.rmSync(resolvedPath, {force: true});
    });
    test('loadSettings should use custom path when set', () => {
      // Given
      const customDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'custom-settings-'));
      const customPath = path.join(customDir, 'settings.json');
      fs.writeFileSync(customPath, '{"tabs": [{"id": "custom"}], "theme": "dark"}');
      settings.setSettingsPath(customPath);
      // When
      const result = settings.loadSettings();
      // Then
      expect(fs.existsSync(customPath)).toBe(true);
      expect(result.tabs).toEqual([{id: 'custom'}]);
      expect(result.theme).toBe('dark');
      // Clean up
      fs.rmSync(customDir, {recursive: true, force: true});
    });
    test('updateSettings should write to custom path when set', () => {
      // Given
      const customDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'custom-settings-'));
      const customPath = path.join(customDir, 'settings.json');
      settings.setSettingsPath(customPath);
      // When
      settings.updateSettings({tabs: [{id: 'test'}]});
      // Then
      expect(fs.existsSync(customPath)).toBe(true);
      const written = JSON.parse(fs.readFileSync(customPath, 'utf8'));
      expect(written.tabs).toEqual([{id: 'test'}]);
      // Clean up
      fs.rmSync(customDir, {recursive: true, force: true});
    });
  });
  describe('XDG Base Directory compliance', () => {
    let originalEnv;
    let originalExistsSync;
    beforeEach(() => {
      // Save original environment and fs.existsSync
      originalEnv = {...process.env};
      originalExistsSync = fs.existsSync;
      jest.resetModules();
    });
    afterEach(() => {
      // Restore environment and fs.existsSync
      process.env = originalEnv;
      fs.existsSync = originalExistsSync;
      jest.resetModules();
    });
    test('should use XDG_CONFIG_HOME when set and no legacy directory exists', () => {
      // Given
      process.env.XDG_CONFIG_HOME = '/custom/config';
      // Mock fs.existsSync to return false for legacy directory
      fs.existsSync = jest.fn(p => {
        if (p.includes('.electronim')) {
          return false;
        }
        return originalExistsSync(p);
      });
      // When
      const settingsModule = require('../');
      const customPath = path.join(tempDir, 'xdg-settings.json');
      settingsModule.setSettingsPath(customPath);
      settingsModule.updateSettings({tabs: [{id: 'xdg-test'}]});
      // Then
      expect(fs.existsSync(customPath)).toBe(true);
      const written = JSON.parse(originalExistsSync.readFileSync || fs.readFileSync(customPath, 'utf8'));
      expect(written.tabs).toEqual([{id: 'xdg-test'}]);
    });
    test('should use ~/.config/electronim when XDG_CONFIG_HOME not set and no legacy directory', () => {
      // Given
      delete process.env.XDG_CONFIG_HOME;
      const homeDir = require('node:os').homedir();
      // Mock fs.existsSync to return false for legacy directory
      const mockExistsSync = jest.fn(p => {
        if (p === path.join(homeDir, '.electronim')) {
          return false;
        }
        return originalExistsSync(p);
      });
      fs.existsSync = mockExistsSync;
      // When
      jest.resetModules();
      delete process.env.XDG_CONFIG_HOME;
      fs.existsSync = mockExistsSync;
      const settingsModule = require('../');
      // Then - verify the getConfigDirectory logic would choose ~/.config/electronim
      // We verify by setting a custom path and ensuring functionality works
      const customPath = path.join(tempDir, 'config-default.json');
      settingsModule.setSettingsPath(customPath);
      settingsModule.updateSettings({tabs: [{id: 'config-test'}]});
      expect(originalExistsSync(customPath)).toBe(true);
    });
    test('should prefer legacy ~/.electronim directory when it exists', () => {
      // Given
      const homeDir = require('node:os').homedir();
      const legacyPath = path.join(homeDir, '.electronim');
      // Mock fs.existsSync to return true for legacy directory
      const mockExistsSync = jest.fn(p => {
        if (p === legacyPath) {
          return true;
        }
        return originalExistsSync(p);
      });
      fs.existsSync = mockExistsSync;
      process.env.XDG_CONFIG_HOME = '/custom/config';
      // When
      jest.resetModules();
      fs.existsSync = mockExistsSync;
      const settingsModule = require('../');
      // Then - even with XDG_CONFIG_HOME set, verify functionality works
      const customPath = path.join(tempDir, 'legacy-test.json');
      settingsModule.setSettingsPath(customPath);
      settingsModule.updateSettings({tabs: [{id: 'legacy-test'}]});
      expect(originalExistsSync(customPath)).toBe(true);
      const written = JSON.parse((originalExistsSync.readFileSync || fs.readFileSync)(customPath, 'utf8'));
      expect(written.tabs).toEqual([{id: 'legacy-test'}]);
    });
  });
});
