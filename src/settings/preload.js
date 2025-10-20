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
/* eslint-disable no-undef */
const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electron', {
  closeDialog: () => ipcRenderer.send(APP_EVENTS.closeDialog),
  settingsSave: settings => ipcRenderer.send(APP_EVENTS.settingsSave, settings),
  settingsLoad: () => ipcRenderer.invoke(APP_EVENTS.settingsLoad),
  settingsExport: () => ipcRenderer.invoke(APP_EVENTS.settingsExport),
  settingsImport: () => ipcRenderer.invoke(APP_EVENTS.settingsImport),
  settingsOpenFolder: () => ipcRenderer.invoke(APP_EVENTS.settingsOpenFolder),
  dictionaryGetAvailable: () => ipcRenderer.invoke(APP_EVENTS.dictionaryGetAvailable),
  dictionaryGetAvailableNative: () => ipcRenderer.invoke(APP_EVENTS.dictionaryGetAvailableNative),
  dictionaryGetEnabled: () => ipcRenderer.invoke(APP_EVENTS.dictionaryGetEnabled)
});
