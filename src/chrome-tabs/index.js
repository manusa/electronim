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
const {APP_EVENTS, TAB_POSITIONS, tabIconSizeOrDefault, verticalTabsWidth} = require('../constants');
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
      const tabElement = element?.closest('[data-tab-id]');
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
  const {tabPosition, tabIconSize} = loadSettings();
  tabContainer.tabPosition = tabPosition === TAB_POSITIONS.left ? TAB_POSITIONS.left : TAB_POSITIONS.top;
  tabContainer.tabIconSize = tabIconSizeOrDefault(tabIconSize);
  tabContainer.webContents.loadURL(
    `file://${__dirname}/index.html?tabPosition=${tabContainer.tabPosition}&tabIconSize=${tabContainer.tabIconSize}`,
    {extraHeaders: 'pragma: no-cache\nCache-control: no-cache'});
  tabContainer.webContents.on('context-menu', handleContextMenu(tabContainer));
  return tabContainer;
};

const isNotTabContainer = bv => bv.isTabContainer !== true;

/**
 * Computes the bounds of the tab container and of the active service for the given content size.
 * @param {Electron.WebContentsView} tabContainer the tab container (its tabPosition sets the layout).
 * @param {{width: number, height: number}} contentBounds the content bounds of the main window.
 * @returns {{tabContainer: Electron.Rectangle, service: Electron.Rectangle}}
 */
const tabContainerLayout = (tabContainer, {width, height}) => {
  if (tabContainer.tabPosition === TAB_POSITIONS.left) {
    const tabsWidth = verticalTabsWidth(tabContainer.tabIconSize);
    return {
      tabContainer: {x: 0, y: 0, width: tabsWidth, height},
      service: {x: tabsWidth, y: 0, width: width - tabsWidth, height}
    };
  }
  return {
    tabContainer: {x: 0, y: 0, width, height: TABS_CONTAINER_HEIGHT},
    service: {x: 0, y: TABS_CONTAINER_HEIGHT, width, height: height - TABS_CONTAINER_HEIGHT}
  };
};

module.exports = {
  newTabContainer, isNotTabContainer, tabContainerLayout
};
