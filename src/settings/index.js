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
const {WebContentsView, dialog, shell, ipcMain: eventBus} = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const HOME_DIR = require('node:os').homedir();
const {APP_EVENTS, CLOSE_BUTTON_BEHAVIORS, KEYBOARD_SHORTCUTS} = require('../constants');
const {showDialog} = require('../base-window');

const APP_DIR = '.electronim';
const APP_NAME = 'electronim';
const SETTINGS_FILE = 'settings.json';
const DEFAULT_SETTINGS = {
  tabs: [],
  useNativeSpellChecker: false,
  enabledDictionaries: ['en'],
  theme: 'system',
  trayEnabled: false,
  startMinimized: false,
  closeButtonBehavior: CLOSE_BUTTON_BEHAVIORS.quit,
  keyboardShortcuts: {
    tabSwitchModifier: KEYBOARD_SHORTCUTS.tabSwitchModifier,
    tabTraverseModifier: KEYBOARD_SHORTCUTS.tabTraverseModifier
  }
};

const webPreferences = {
  contextIsolation: false,
  nativeWindowOpen: true,
  nodeIntegration: false,
  sandbox: true,
  preload: path.resolve(__dirname, '..', '..', 'bundles', 'settings.preload.js'),
  partition: 'persist:electronim'
};

/**
 * Determines the appropriate config directory based on XDG Base Directory specification.
 * Provides backward compatibility by checking for legacy directory first.
 *
 * Priority order:
 * 1. Legacy directory (~/.electronim) if it exists
 * 2. XDG_CONFIG_HOME/electronim if XDG_CONFIG_HOME is set
 * 3. ~/.config/electronim (XDG default)
 *
 * @returns {string} The path to the config directory
 */
const resolveConfigDirectory = () => {
  const legacyDir = path.join(HOME_DIR, APP_DIR);

  // Check if legacy directory exists (backward compatibility)
  if (fs.existsSync(legacyDir)) {
    return legacyDir;
  }

  // Use XDG_CONFIG_HOME if set, otherwise default to ~/.config
  const xdgConfigHome = process.env.XDG_CONFIG_HOME || path.join(HOME_DIR, '.config');
  return path.join(xdgConfigHome, APP_NAME);
};

// Overrideable for tests
const paths = {};
paths.appDir = resolveConfigDirectory();
paths.settingsPath = path.join(paths.appDir, SETTINGS_FILE);

/**
 * Sets a custom settings file path.
 * This allows users to specify a different location for their settings file,
 * enabling multiple profiles or custom configurations.
 *
 * @param {string} customPath - The absolute or relative path to the settings file
 */
const setSettingsPath = customPath => {
  const resolvedPath = path.resolve(customPath);
  paths.settingsPath = resolvedPath;
  paths.appDir = path.dirname(resolvedPath);
};

/**
 * Wrapper function to retrieve the current system's platform.
 *
 * @returns {NodeJS.Platform} the OS platform.
 */
const getPlatform = () => process.platform;

const containsTabId = tabs => tabId => tabs.map(({id}) => id).includes(tabId);

const ensureDefaultValues = settings => {
  settings = Object.assign(DEFAULT_SETTINGS, settings);
  let {activeTab} = settings;
  const enabledTabs = settings.tabs.filter(({disabled}) => !disabled);
  if (enabledTabs.length > 0 && !containsTabId(enabledTabs)(activeTab)) {
    activeTab = enabledTabs[0].id;
  }
  return {...settings, activeTab};
};

const migrate = settings => {
  // en-us dictionary key is now en
  if (settings.enabledDictionaries.includes('en-US')) {
    settings.enabledDictionaries = settings.enabledDictionaries
      .filter(dictionary => dictionary !== 'en-US')
      .filter(dictionary => dictionary !== 'en')
      .concat('en');
  }
  return settings;
};

const initAppDir = () => fs.mkdirSync(paths.appDir, {recursive: true});

const loadSettings = () => {
  initAppDir();
  let loadedSettings = {};
  if (fs.existsSync(paths.settingsPath)) {
    loadedSettings = JSON.parse(fs.readFileSync(paths.settingsPath));
  }
  return migrate(ensureDefaultValues(loadedSettings));
};

const writeSettings = settings => {
  initAppDir();
  fs.writeFileSync(paths.settingsPath, JSON.stringify(settings, null, 2));
};

const updateSettings = settings =>
  writeSettings(ensureDefaultValues({...loadSettings(), ...settings}));

const exportSettings = mainWindow => async () => {
  try {
    const settings = loadSettings();
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export ElectronIM Settings',
      defaultPath: path.join(HOME_DIR, 'electronim-settings.json'),
      filters: [
        {name: 'JSON Files', extensions: ['json']},
        {name: 'All Files', extensions: ['*']}
      ]
    });

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, JSON.stringify(settings, null, 2));
      return {success: true, filePath: result.filePath};
    }
    return {success: false, canceled: true};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

const importSettings = mainWindow => async () => {
  try {
    // First, show confirmation dialog
    const confirmResult = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Cancel', 'Import'],
      defaultId: 1,
      cancelId: 0,
      title: 'Import Settings',
      message: 'Import settings from file?',
      detail: 'This will replace your current settings. Your existing configuration will be overwritten.'
    });

    if (confirmResult.response !== 1) {
      return {success: false, canceled: true};
    }

    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import ElectronIM Settings',
      defaultPath: HOME_DIR,
      filters: [
        {name: 'JSON Files', extensions: ['json']},
        {name: 'All Files', extensions: ['*']}
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const importedSettings = JSON.parse(fileContent);

      // Validate that it looks like settings by checking for required fields
      if (typeof importedSettings === 'object' && importedSettings !== null) {
        // Merge with default settings to ensure all required fields exist
        const validatedSettings = ensureDefaultValues(importedSettings);
        eventBus.emit(APP_EVENTS.settingsSave, null, validatedSettings);
        return {success: true, filePath, shouldReload: true};
      }
      return {success: false, error: 'Invalid settings file format'};
    }
    return {success: false, canceled: true};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

const openElectronimFolder = async () => {
  try {
    await shell.openPath(paths.appDir);
    return {success: true, path: paths.appDir};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

const openSettingsDialog = mainWindow => () => {
  const settingsView = new WebContentsView({webPreferences});
  settingsView.webContents.loadURL(`file://${__dirname}/index.html`);
  showDialog(mainWindow, settingsView);
};

module.exports = {
  getPlatform, loadSettings, updateSettings, openSettingsDialog, exportSettings, importSettings, openElectronimFolder,
  setSettingsPath
};
