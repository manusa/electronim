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
  // Sending events to main process
  appMenuOpen: () => ipcRenderer.send(APP_EVENTS.appMenuOpen),
  servicesReady: () => ipcRenderer.send(APP_EVENTS.servicesReady, {}),
  activateService: ({id, restoreWindow}) =>
    ipcRenderer.send(APP_EVENTS.activateService, {id, restoreWindow}),
  servicesReorder: ({tabIds}) => ipcRenderer.send(APP_EVENTS.servicesReorder, {tabIds}),
  // Receiving events from main process
  onAddServices: callback => ipcRenderer.on(APP_EVENTS.addServices, (_event, tabs) => callback(tabs)),
  onActivateServiceInContainer: callback =>
    ipcRenderer.on(APP_EVENTS.activateServiceInContainer, (_event, data) => callback(data)),
  onElectronimNewVersionAvailable: callback =>
    ipcRenderer.on(APP_EVENTS.electronimNewVersionAvailable, (_event, data) => callback(data)),
  onSetServiceDisableNotifications: callback =>
    ipcRenderer.on(APP_EVENTS.setServiceDisableNotifications, (_event, data) => callback(data)),
  onSetServiceFavicon: callback =>
    ipcRenderer.on(APP_EVENTS.setServiceFavicon, (_event, data) => callback(data)),
  onSetServiceTitle: callback =>
    ipcRenderer.on(APP_EVENTS.setServiceTitle, (_event, data) => callback(data))
});
