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
const {BrowserView, Menu, MenuItem, ipcMain: eventBus} = require('electron');
const path = require('path');
const {APP_EVENTS} = require('../constants');
const {getLatestRelease} = require('./check-for-updates');

const TABS_CONTAINER_HEIGHT = 46;

const webPreferences = {
  contextIsolation: false,
  nodeIntegration: false,
  sandbox: true,
  preload: path.resolve(__dirname, '..', '..', 'bundles', 'chrome-tabs.preload.js'),
  partition: 'persist:electronim'
};

const checkForUpdates = webContents => {
  getLatestRelease()
    .then(release => {
      webContents.send(APP_EVENTS.electronimNewVersionAvailable, !release.matchesCurrent);
    })
    // eslint-disable-next-line no-console
    .catch(e => console.debug('Error checking for updates', e));
};

const handleContextMenu = viewOrWindow => (event, params) => {
  const menu = new Menu();
  menu.append(new MenuItem({
    label: 'Settings',
    click: () => eventBus.emit(APP_EVENTS.settingsOpenDialog, event, params)
  }));
  menu.append(new MenuItem({
    label: 'Help',
    click: () => eventBus.emit(APP_EVENTS.helpOpenDialog, event, params)
  }));
  menu.append(new MenuItem({
    label: 'DevTools',
    click: () => viewOrWindow.webContents.openDevTools({mode: 'detach', activate: true})
  }));
  const {x, y} = params;
  menu.popup({x, y});
};

/**
 * Creates a new BrowserView instance with the Chrome Tabs
 * @returns {Electron.CrossProcessExports.BrowserView}
 */
const newTabContainer = () => {
  const tabContainer = new BrowserView({webPreferences});
  tabContainer.isTabContainer = true;
  tabContainer.setAutoResize({width: false, horizontal: false, height: false, vertical: false});
  tabContainer.webContents.loadURL(`file://${__dirname}/index.html`,
    {extraHeaders: 'pragma: no-cache\nCache-control: no-cache'});
  tabContainer.webContents.on('context-menu', handleContextMenu(tabContainer));
  eventBus.once(APP_EVENTS.tabsReady, () => checkForUpdates(tabContainer.webContents));
  setInterval(() => checkForUpdates(tabContainer.webContents), 1000 * 60 * 30).unref();
  return tabContainer;
};

const isNotTabContainer = bv => bv.isTabContainer !== true;

module.exports = {
  TABS_CONTAINER_HEIGHT, newTabContainer, isNotTabContainer
};
