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
const {contextBridge, ipcRenderer} = require('electron');
const {APP_EVENTS} = require('../constants');

const api = {
  close: () => ipcRenderer.sendSync(APP_EVENTS.closeDialog),
  getMetrics: () => ipcRenderer.sendSync(APP_EVENTS.taskManagerGetMetrics),
  killProcess: id => ipcRenderer.send(APP_EVENTS.taskManagerKillProcess, {id})
};

contextBridge.exposeInMainWorld('electron', api);

module.exports = {api};
