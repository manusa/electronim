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
const {WebContentsView, Menu, MenuItem, ipcMain: eventBus} = require('electron');
const path = require('node:path');
const {APP_EVENTS} = require('../constants');
const {loadSettings} = require('../settings');

const TABS_CONTAINER_HEIGHT = 46;

const webPreferences = {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  preload: path.resolve(__dirname, '..', '..', 'bundles', 'chrome-tabs.preload.js'),
  partition: 'persist:electronim'
};

const handleContextMenu = viewOrWindow => async (event, params) => {
  const menu = new Menu();

  // Try to find the service ID at the clicked position
  const serviceId = await viewOrWindow.webContents.executeJavaScript(`
    (function() {
      const element = document.elementFromPoint(${params.x}, ${params.y});
      const tabElement = element?.closest('.chrome-tab');
      return tabElement?.getAttribute('data-tab-id') || null;
    })();
  `).catch(() => null);

  if (serviceId) {
    const {disableNotificationsGlobally, tabs: services} = loadSettings();

    // Only show service-specific notification menu if notifications are not disabled globally
    if (!disableNotificationsGlobally) {
      const currentService = services.find(service => service.id === serviceId);
      const currentServiceHasNotificationsDisabled = currentService?.disableNotifications === true;
      menu.append(new MenuItem({
        label: currentServiceHasNotificationsDisabled ? 'Enable notifications' : 'Disable notifications',
        click: () => eventBus.emit(APP_EVENTS.setServiceDisableNotifications, event, {
          id: serviceId,
          disableNotifications: !currentServiceHasNotificationsDisabled
        })
      }));
      menu.append(new MenuItem({type: 'separator'}));
    }

    menu.append(new MenuItem({
      label: 'Reload',
      click: () => eventBus.emit(APP_EVENTS.reloadTab, event, {tabId: serviceId})
    }));
    menu.append(new MenuItem({type: 'separator'}));
  }

  menu.append(new MenuItem({
    label: 'Task Manager',
    click: () => eventBus.emit(APP_EVENTS.taskManagerOpenDialog, event, params)
  }));
  menu.append(new MenuItem({type: 'separator'}));
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
 * Creates a new WebContentsView instance with the Chrome Tabs
 * @returns {Electron.CrossProcessExports.WebContentsView}
 */
const newTabContainer = () => {
  const tabContainer = new WebContentsView({webPreferences});
  tabContainer.isTabContainer = true;
  tabContainer.webContents.loadURL(`file://${__dirname}/index.html`,
    {extraHeaders: 'pragma: no-cache\nCache-control: no-cache'});
  tabContainer.webContents.on('context-menu', handleContextMenu(tabContainer));
  return tabContainer;
};

const isNotTabContainer = bv => bv.isTabContainer !== true;

module.exports = {
  TABS_CONTAINER_HEIGHT, newTabContainer, isNotTabContainer
};
