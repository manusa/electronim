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
const fs = require('fs');
const path = require('path');

const findRootDir = () => {
  let rootDir = __dirname;
  while (!fs.existsSync(path.join(rootDir, 'package.json'))) {
    rootDir = path.join(rootDir, '..');
  }
  return rootDir;
};

const APP_EVENTS = {
  aboutOpenDialog: 'aboutOpenDialog',
  activateTab: 'activateTab',
  activateTabInContainer: 'activateTabInContainer',
  addTabs: 'addTabs',
  appMenuOpen: 'appMenuOpen',
  appMenuClose: 'appMenuClose',
  canNotify: 'canNotify',
  closeDialog: 'closeDialog',
  desktopCapturerGetSources: 'desktopCapturerGetSources',
  dictionaryGetAvailable: 'dictionaryGetAvailable',
  dictionaryGetAvailableNative: 'dictionaryGetAvailableNative',
  dictionaryGetEnabled: 'dictionaryGetEnabled',
  dictionaryGetMisspelled: 'dictionaryGetMisspelled',
  electronimNewVersionAvailable: 'electronimNewVersionAvailable',
  fullscreenToggle: 'fullscreenToggle',
  helpOpenDialog: 'helpOpenDialog',
  notificationClick: 'notificationClick',
  quit: 'quit',
  reload: 'reload',
  // Restore and show the main window in case it was hidden
  restore: 'restore',
  settingsLoad: 'settingsLoad',
  settingsOpenDialog: 'settingsOpenDialog',
  settingsSave: 'settingsSave',
  setTabFavicon: 'setTabFavicon',
  setTabTitle: 'setTabTitle',
  tabsReady: 'tabsReady',
  tabReorder: 'tabReorder',
  tabSwitchToPosition: 'tabSwitchToPosition',
  tabTraverseNext: 'tabTraverseNext',
  tabTraversePrevious: 'tabTraversePrevious',
  trayInit: 'trayInit',
  zoomIn: 'zoomIn',
  zoomOut: 'zoomOut',
  zoomReset: 'zoomReset'
};

const CLOSE_BUTTON_BEHAVIORS = {
  minimize: 'minimize',
  quit: 'quit'
};

const ELECTRONIM_VERSION = JSON.parse(fs.readFileSync(path.resolve(findRootDir(), 'package.json'), 'utf8')).version;

module.exports = {
  APP_EVENTS, CLOSE_BUTTON_BEHAVIORS, ELECTRONIM_VERSION
};
