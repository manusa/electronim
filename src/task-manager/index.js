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
const {WebContentsView, app, ipcMain: eventBus} = require('electron');
const path = require('node:path');
const {APP_EVENTS} = require('../constants');
const {showDialog} = require('../base-window');
const {handleRedirect, windowOpenHandler} = require('../service-manager/redirect');
const {handleContextMenu} = require('../service-manager/context-menu');

const webPreferences = {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  preload: path.resolve(__dirname, '..', '..', 'bundles', 'task-manager.preload.js')
};

const getMetrics = serviceManagerModule => () => {
  const appMetrics = app.getAppMetrics();
  const services = serviceManagerModule.getServices ? serviceManagerModule.getServices() : {};

  return Object.entries(services).map(([id, service]) => {
    const osPid = service.webContents.getOSProcessId();
    const processMetrics = appMetrics.find(m => m.pid === osPid);

    return {
      id,
      name: service.webContents.getTitle() || id,
      pid: osPid,
      memory: processMetrics ? processMetrics.memory : {},
      cpu: processMetrics ? processMetrics.cpu : {}
    };
  });
};

const killProcess = serviceManagerModule => (_event, {id}) => {
  const service = serviceManagerModule.getService(id);
  if (service) {
    try {
      service.webContents.once('render-process-gone', service.webContents.reload);
      service.webContents.forcefullyCrashRenderer();
      // Kill the renderer process using the OS too (prevents hanging processes in Linux)
      process.kill(service.webContents.getOSProcessId(), 'SIGKILL');
    } catch (error) {
      console.error('Error killing process:', error);
    }
  }
};

const openDevTools = serviceManagerModule => (_event, {id}) => {
  const service = serviceManagerModule.getService(id);
  if (service?.webContents) {
    try {
      service.webContents.openDevTools({mode: 'detach', activate: true});
    } catch (error) {
      console.error('Error opening DevTools:', error);
    }
  }
};

const openTaskManagerDialog = (baseWindow, serviceManagerModule) => () => {
  const taskManagerView = new WebContentsView({webPreferences});
  taskManagerView.webContents.loadURL(`file://${__dirname}/index.html`);
  taskManagerView.webContents.on('will-navigate', handleRedirect(taskManagerView));
  taskManagerView.webContents.setWindowOpenHandler(windowOpenHandler(taskManagerView));
  taskManagerView.webContents.on('context-menu', handleContextMenu(taskManagerView));

  const getMetricsHandler = event => {
    event.returnValue = getMetrics(serviceManagerModule)();
  };

  const killProcessHandler = killProcess(serviceManagerModule);
  const openDevToolsHandler = openDevTools(serviceManagerModule);

  eventBus.on(APP_EVENTS.taskManagerGetMetrics, getMetricsHandler);
  eventBus.on(APP_EVENTS.taskManagerKillProcess, killProcessHandler);
  eventBus.on(APP_EVENTS.taskManagerOpenDevTools, openDevToolsHandler);

  taskManagerView.webContents.on('destroyed', () => {
    eventBus.removeListener(APP_EVENTS.taskManagerGetMetrics, getMetricsHandler);
    eventBus.removeListener(APP_EVENTS.taskManagerKillProcess, killProcessHandler);
    eventBus.removeListener(APP_EVENTS.taskManagerOpenDevTools, openDevToolsHandler);
  });

  showDialog(baseWindow, taskManagerView);
};

module.exports = {openTaskManagerDialog, getMetrics, killProcess, openDevTools};
