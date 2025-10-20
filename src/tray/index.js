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
const {ipcMain: eventBus, Tray, Menu, MenuItem} = require('electron');
const {APP_EVENTS} = require('../constants');
const path = require('node:path');
const {getPlatform, loadSettings} = require('../settings');
let tray;

const images = {
  linux: 'icon.png',
  darwin: 'iconTemplate.png',
  win32: 'icon.ico'
};

const createContextMenu = () => {
  const menu = new Menu();
  menu.append(new MenuItem({
    label: 'Show',
    click: () => eventBus.emit(APP_EVENTS.restore)
  }));
  menu.append(new MenuItem({type: 'separator'}));
  menu.append(new MenuItem({
    label: 'Quit',
    click: () => eventBus.emit(APP_EVENTS.quit)
  }));
  return menu;
};

const initTray = () => {
  const {trayEnabled} = loadSettings();
  const trayExists = tray?.destroy;

  // Only destroy and recreate if tray state is changing
  if (trayExists && !trayEnabled) {
    // Tray is enabled but should be disabled
    tray.destroy();
    tray = null;
  } else if (!trayExists && trayEnabled) {
    // Tray is disabled but should be enabled
    tray = new Tray(path.resolve(__dirname, '..', 'assets', images[getPlatform()] || images.win32));
    tray.on('click', () => eventBus.emit(APP_EVENTS.restore));
    tray.setContextMenu(createContextMenu());
  }
  // If tray state hasn't changed, do nothing to avoid creating duplicates
  return tray;
};

module.exports = {initTray};
