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
const {BrowserWindow, Notification, app, ipcMain: ipc} = require('electron');
const {APP_EVENTS} = require('../constants');
const {TABS_CONTAINER_HEIGHT, initTabContainer} = require('../chrome-tabs');
const {loadSettings, updateSettings, openSettingsDialog} = require('../settings');
const {loadDictionaries} = require('../spell-check');
const tabManager = require('../tab-manager');
const {initBrowserVersions, userAgentForView} = require('../user-agent');

const webPreferences = {
  preload: `${__dirname}/preload.js`,
  partition: 'persist:electronim'
};

let mainWindow;
let tabContainer;

const activateTab = tabId => {
  const activeTab = tabManager.getTab(tabId);
  if (activeTab) {
    const {width, height} = mainWindow.getContentBounds();
    mainWindow.setBrowserView(tabContainer);
    mainWindow.addBrowserView(activeTab);
    tabManager.setActiveTab(tabId);
    tabContainer.setBounds({x: 0, y: 0, width, height: TABS_CONTAINER_HEIGHT});
    activeTab.setBounds({x: 0, y: TABS_CONTAINER_HEIGHT, width, height: height - TABS_CONTAINER_HEIGHT});
    activeTab.webContents.focus();
  }
};

const handleTabReload = event => event.sender.reloadIgnoringCache();

const handleZoomIn = event => event.sender.setZoomFactor(event.sender.getZoomFactor() + 0.1);

const handleZoomOut = event => {
  const newFactor = event.sender.getZoomFactor() - 0.1;
  if (newFactor >= 0.1) {
    event.sender.setZoomFactor(newFactor);
  }
};

const handleZoomReset = event => event.sender.setZoomFactor(1);

const handleTabReorder = (event, {tabIds: visibleTabIds}) => {
  const currentTabs = loadSettings().tabs;
  const hiddenTabIds = currentTabs.map(({id}) => id)
    .filter(tabId => !visibleTabIds.includes(tabId));
  const currentTabMap = currentTabs.reduce((acc, tab) => {
    acc[tab.id] = tab; return acc;
  }, {});
  const tabs = [
    ...visibleTabIds.map(tabId => currentTabMap[tabId]),
    ...hiddenTabIds.map(tabId => currentTabMap[tabId])
  ];
  updateSettings({tabs});
};

const initTabListener = () => {
  ipc.on(APP_EVENTS.tabsReady, event => {
    const currentSettings = loadSettings();
    const tabs = currentSettings.tabs
      .filter(tab => !tab.disabled)
      .map(tab => ({...tab, active: tab.id === currentSettings.activeTab}));
    if (tabs.length > 0) {
      const ipcSender = event.sender;
      tabManager.addTabs(ipcSender)(tabs);
      ipcSender.send(APP_EVENTS.activateTab, {tabId: currentSettings.activeTab});
    } else {
      openSettingsDialog(mainWindow);
    }
  });
  ipc.on(APP_EVENTS.activateTab, (event, data) => activateTab(data.id));
  ipc.on(APP_EVENTS.canNotify, (event, tabId) => {
    event.returnValue = tabManager.canNotify(tabId);
  });
  ipc.on(APP_EVENTS.notificationClick, (event, {tabId}) => {
    tabContainer.webContents.send(APP_EVENTS.activateTabInContainer, {tabId});
    mainWindow.restore();
    mainWindow.show();
    activateTab(tabId);
  });
  ipc.on(APP_EVENTS.reload, handleTabReload);
  ipc.on(APP_EVENTS.settingsOpenDialog, () => openSettingsDialog(mainWindow));
  ipc.on(APP_EVENTS.tabReorder, handleTabReorder);
  ipc.on(APP_EVENTS.zoomIn, handleZoomIn);
  ipc.on(APP_EVENTS.zoomOut, handleZoomOut);
  ipc.on(APP_EVENTS.zoomReset, handleZoomReset);
};

const closeSettings = () => {
  const settingsView = mainWindow.getBrowserView();
  activateTab(tabManager.getActiveTab());
  settingsView.destroy();
};

const saveSettings = (event, settings) => {
  updateSettings(settings);
  loadDictionaries();
  const currentBrowserView = mainWindow.getBrowserView();
  mainWindow.removeBrowserView(currentBrowserView);
  tabManager.removeAll();
  const viewsToDestroy = [currentBrowserView, tabContainer];
  tabContainer = initTabContainer(mainWindow);
  viewsToDestroy.forEach(view => view.destroy());
};

const initSettingsListener = () => {
  ipc.on(APP_EVENTS.settingsSave, saveSettings);
  ipc.on(APP_EVENTS.settingsCancel, closeSettings);
};

const browserVersionsReady = () => {
  app.userAgentFallback = userAgentForView(mainWindow);
  tabContainer = initTabContainer(mainWindow);
};

const init = () => {
  loadDictionaries();
  const {width = 800, height = 600} = loadSettings();
  mainWindow = new BrowserWindow({
    width, height, resizable: true, maximizable: false, webPreferences
  });
  mainWindow.removeMenu();
  mainWindow.on('resize', () => {
    const [currentWidth, currentHeight] = mainWindow.getSize();
    updateSettings({width: currentWidth, height: currentHeight});
  });
  mainWindow.on('maximize', () => {
    // Hack to resize window contents when window is maximized (resize event is not triggered)
    setTimeout(activateTab, 50, tabManager.getActiveTab());
  });
  mainWindow.on('closed', () => app.quit());
  initTabListener();
  initSettingsListener();
  initBrowserVersions()
    .then(browserVersionsReady)
    .catch(() => {
      new Notification({
        title: 'ElectronIM: No network available',
        urgency: 'critical'
      }).show();
      browserVersionsReady();
    });

  return mainWindow;
};

module.exports = {APP_EVENTS, init};
