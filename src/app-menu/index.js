/*
   Copyright 2022 Marc Nuri San Felix

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
const path = require('node:path');
const {WebContentsView} = require('electron');

const webPreferences = {
  transparent: true,
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  preload: path.resolve(__dirname, '..', '..', 'bundles', 'app-menu.preload.js')
};

/**
 * Creates a new WebContentsView instance with the App Menu
 * @returns {Electron.CrossProcessExports.WebContentsView}
 */
const newAppMenu = () => {
  const appMenu = new WebContentsView({webPreferences});
  appMenu.isAppMenu = true;
  appMenu.webContents.loadURL(`file://${__dirname}/index.html`);
  return appMenu;
};

const isNotAppMenu = bv => bv.isAppMenu !== true;

module.exports = {newAppMenu, isNotAppMenu};
