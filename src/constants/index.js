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
const fs = require('node:fs');
const path = require('node:path');

const findRootDir = () => {
  let rootDir = __dirname;
  while (!fs.existsSync(path.join(rootDir, 'package.json'))) {
    rootDir = path.join(rootDir, '..');
  }
  return rootDir;
};

const APP_EVENTS = {
  aboutOpenDialog: 'aboutOpenDialog',
  activateService: 'activateService',
  activateServiceInContainer: 'activateServiceInContainer',
  addServices: 'addServices',
  appMenuOpen: 'appMenuOpen',
  appMenuClose: 'appMenuClose',
  canNotify: 'canNotify',
  closeDialog: 'closeDialog',
  desktopCapturerGetSources: 'desktopCapturerGetSources',
  escape: 'escape',
  dictionaryGetAvailable: 'dictionaryGetAvailable',
  dictionaryGetAvailableNative: 'dictionaryGetAvailableNative',
  dictionaryGetEnabled: 'dictionaryGetEnabled',
  dictionaryGetMisspelled: 'dictionaryGetMisspelled',
  electronimNewVersionAvailable: 'electronimNewVersionAvailable',
  findInPage: 'findInPage',
  findInPageFound: 'findInPageFound',
  findInPageReady: 'findInPageReady',
  findInPageStop: 'findInPageStop',
  findInPageClose: 'findInPageClose',
  findInPageOpen: 'findInPageOpen',
  fullscreenToggle: 'fullscreenToggle',
  helpOpenDialog: 'helpOpenDialog',
  keyboardEventsInit: 'keyboardEventsInit',
  notificationClick: 'notificationClick',
  quit: 'quit',
  reload: 'reload',
  reloadTab: 'reloadTab',
  // Restore and show the main window in case it was hidden
  restore: 'restore',
  settingsLoad: 'settingsLoad',
  settingsOpenDialog: 'settingsOpenDialog',
  settingsSave: 'settingsSave',
  settingsExport: 'settingsExport',
  settingsImport: 'settingsImport',
  settingsOpenFolder: 'settingsOpenFolder',
  setServiceDisableNotifications: 'setServiceDisableNotifications',
  setServiceFavicon: 'setServiceFavicon',
  setServiceTitle: 'setServiceTitle',
  servicesReady: 'servicesReady',
  servicesReorder: 'servicesReorder',
  tabSwitchToPosition: 'tabSwitchToPosition',
  tabTraverseNext: 'tabTraverseNext',
  tabTraversePrevious: 'tabTraversePrevious',
  trayInit: 'trayInit',
  zoomIn: 'zoomIn',
  zoomOut: 'zoomOut',
  zoomReset: 'zoomReset'
};

const CLOSE_BUTTON_BEHAVIORS = Object.freeze({
  minimize: 'minimize',
  quit: 'quit'
});

const KEYBOARD_SHORTCUTS = Object.freeze({
  tabSwitchModifier: 'Ctrl',
  tabTraverseModifier: 'Ctrl'
});

const ELECTRONIM_VERSION = JSON.parse(fs.readFileSync(path.resolve(findRootDir(), 'package.json'), 'utf8')).version;

module.exports = {
  APP_EVENTS, CLOSE_BUTTON_BEHAVIORS, ELECTRONIM_VERSION, KEYBOARD_SHORTCUTS
};
