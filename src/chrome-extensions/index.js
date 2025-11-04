/*
   Copyright 2025 Marc Nuri San Felix

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
const {Menu, MenuItem, WebContentsView} = require('electron');
const path = require('node:path');
const {showDialog} = require('../base-window');
const {handleRedirect, windowOpenHandler} = require('../service-manager/redirect');
const {chromeUserAgent} = require('../user-agent');

const webPreferences = {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  preload: path.resolve(__dirname, '..', '..', 'bundles', 'chrome-extensions.preload.js')
};

const handleContextMenu = viewOrWindow => (_event, params) => {
  const {webContents} = viewOrWindow;
  const menu = new Menu();
  menu.append(new MenuItem({
    label: 'DevTools',
    click: () => webContents.openDevTools()
  }));
  const {x, y} = params;
  menu.popup({x: x + 1, y: y + 1});
};

const openChromeWebStore = baseWindow => () => {
  const chromeWebStoreView = new WebContentsView({webPreferences});
  chromeWebStoreView.webContents.setUserAgent(chromeUserAgent());
  chromeWebStoreView.webContents.loadURL('https://chromewebstore.google.com/');
  chromeWebStoreView.webContents.on('will-navigate', handleRedirect(chromeWebStoreView));
  chromeWebStoreView.webContents.on('context-menu', handleContextMenu(chromeWebStoreView));
  chromeWebStoreView.webContents.setWindowOpenHandler(windowOpenHandler(chromeWebStoreView));
  showDialog(baseWindow, chromeWebStoreView);
};

const isChromeExtensionsEnabled = loadSettings => () => {
  const settings = loadSettings();
  return settings.chromeExtensionsPreview === true;
};

module.exports = {openChromeWebStore, isChromeExtensionsEnabled};
