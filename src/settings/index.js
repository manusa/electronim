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
const {BrowserView} = require('electron');
const fs = require('fs');
const path = require('path');
const HOME_DIR = require('os').homedir();

const APP_DIR = '.electronim';
const SETTINGS_FILE = 'settings.json';
const DEFAULT_SETTINGS = {tabs: [], enabledDictionaries: ['en-US']};

const webPreferences = {
  preload: `${__dirname}/preload.js`,
  partition: 'persist:electronim'
};

const appDir = path.join(HOME_DIR, APP_DIR);
const settingsPath = path.join(appDir, SETTINGS_FILE);

const initAppDir = () => fs.mkdirSync(appDir, {recursive: true});

const loadSettings = () => {
  initAppDir();
  let loadedSettings = {};
  if (fs.existsSync(settingsPath)) {
    loadedSettings = JSON.parse(fs.readFileSync(settingsPath));
  }
  return Object.assign(DEFAULT_SETTINGS, loadedSettings);
};

const writeSettings = settings => {
  initAppDir();
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
};

const updateSettings = settings => writeSettings({...loadSettings(), ...settings});

const updateTabUrls = newTabUrls => {
  const {activeTab, tabs} = loadSettings();
  const currentTabUrls = tabs.map(({url}) => url);
  const updatedTabs = [];
  updatedTabs.push(...tabs.filter(tab => newTabUrls.includes(tab.url)));
  newTabUrls.filter(url => !currentTabUrls.includes(url)).forEach(url => updatedTabs.push({id: url, url}));
  updateSettings({tabs: [...updatedTabs]});
  if (updatedTabs.length > 0 && !updatedTabs.map(({id}) => id).includes(activeTab)) {
    updateSettings({activeTab: updatedTabs[0].id});
  }
};

const openSettingsDialog = mainWindow => {
  const settingsView = new BrowserView({webPreferences});
  mainWindow.setBrowserView(settingsView);
  const {width, height} = mainWindow.getContentBounds();
  settingsView.setBounds({x: 0, y: 0, width, height});
  settingsView.setAutoResize({width: true, horizontal: true, height: true, vertical: true});
  settingsView.webContents.loadURL(`file://${__dirname}/index.html`);
};

module.exports = {loadSettings, updateSettings, updateTabUrls, openSettingsDialog};
