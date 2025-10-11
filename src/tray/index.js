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
const {ipcMain: eventBus, Tray} = require('electron');
const {APP_EVENTS} = require('../constants');
const path = require('node:path');
const {getPlatform, loadSettings} = require('../settings');
let tray;

const images = {
  linux: 'icon.png',
  darwin: 'iconTemplate.png',
  win32: 'icon.ico'
};

const initTray = () => {
  if (tray?.destroy) {
    tray.destroy();
    tray = null;
  }
  const {trayEnabled} = loadSettings();
  if (trayEnabled) {
    tray = new Tray(path.resolve(__dirname, '..', 'assets', images[getPlatform()] || images.win32));
    tray.on('click', () => eventBus.emit(APP_EVENTS.restore));
  }
  return tray;
};

module.exports = {initTray};
