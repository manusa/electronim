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
const path = require('path');
const {
  BrowserWindow, Notification, app, desktopCapturer, ipcMain: eventBus, nativeTheme
} = require('electron');
const {APP_EVENTS, CLOSE_BUTTON_BEHAVIORS} = require('../constants');
const {openAboutDialog} = require('../about');
const {newAppMenu, isNotAppMenu} = require('../app-menu');
const {TABS_CONTAINER_HEIGHT, newTabContainer, isNotTabContainer} = require('../chrome-tabs');
const {openHelpDialog} = require('../help');
const {getPlatform, loadSettings, updateSettings, openSettingsDialog} = require('../settings');
const {
  getAvailableDictionaries, getAvailableNativeDictionaries, loadDictionaries, getEnabledDictionaries
} = require('../spell-check');
const tabManager = require('../tab-manager');
const {initTray} = require('../tray');
const {initBrowserVersions, userAgentForView} = require('../user-agent');

const webPreferences = {
  contextIsolation: false,
  nativeWindowOpen: true,
  partition: 'persist:electronim'
};

let mainWindow;
let tabContainer;
let appMenu;

const fixUserDataLocation = () => {
  const userDataPath = app.getPath('userData');
  if (userDataPath && userDataPath.length > 0) {
    app.setPath('userData', userDataPath.toLowerCase());
  }
};

const resetMainWindow = () => {
  const currentViews = mainWindow.getBrowserViews();
  currentViews.filter(isNotTabContainer).forEach(bv => mainWindow.removeBrowserView(bv));
  if (mainWindow.getBrowserViews().length === 0) {
    mainWindow.setBrowserView(tabContainer);
  }
};

const activateTab = tabId => {
  const activeTab = tabManager.getTab(tabId);
  if (activeTab) {
    const {width, height} = mainWindow.getContentBounds();
    resetMainWindow();
    mainWindow.addBrowserView(activeTab);
    tabContainer.setBounds({x: 0, y: 0, width, height: TABS_CONTAINER_HEIGHT});
    activeTab.setBounds({x: 0, y: TABS_CONTAINER_HEIGHT, width, height: height - TABS_CONTAINER_HEIGHT});
    tabManager.setActiveTab(tabId);
    activeTab.webContents.focus();
  }
};

const handleMainWindowResize = () => {
  const [windowWidth, windowHeight] = mainWindow.getSize();
  updateSettings({width: windowWidth, height: windowHeight});

  setTimeout(() => {
    const {width: contentWidth, height: contentHeight} = mainWindow.getContentBounds();
    if (appMenu && appMenu.setBounds) {
      appMenu.setBounds({x: 0, y: 0, width: contentWidth, height: contentHeight});
    }
    let totalHeight = 0;
    const isLast = (idx, array) => idx === array.length - 1;
    mainWindow.getBrowserViews().filter(isNotAppMenu).forEach((bv, idx, array) => {
      const {x: currentX, y: currentY, height: currentHeight} = bv.getBounds();
      let newHeight = currentHeight;
      if (isLast(idx, array)) {
        newHeight = contentHeight - totalHeight;
      }
      bv.setBounds({x: currentX, y: currentY, width: contentWidth, height: newHeight});
      totalHeight += currentHeight;
    });
  });
};

const handleTabReload = event => event.sender.reloadIgnoringCache();

const handleTabTraverse = getTabIdFunction => () => {
  if (mainWindow.getBrowserViews().length === 1) {
    return;
  }
  const tabId = getTabIdFunction();
  tabContainer.webContents.send(APP_EVENTS.activateTabInContainer, {tabId});
  activateTab(tabId);
};

const handleTabSwitchToPosition = tabPosition => {
  handleTabTraverse(() => tabManager.getTabAt(tabPosition))();
};

const handleZoomIn = event => event.sender.setZoomFactor(event.sender.getZoomFactor() + 0.1);

const handleZoomOut = event => {
  const newFactor = event.sender.getZoomFactor() - 0.1;
  if (newFactor >= 0.1) {
    event.sender.setZoomFactor(newFactor);
  }
};

const handleZoomReset = event => event.sender.setZoomFactor(1);

const handleTabReorder = (_event, {tabIds: visibleTabIds}) => {
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
  eventBus.on(APP_EVENTS.tabsReady, event => {
    const currentSettings = loadSettings();
    const tabs = currentSettings.tabs
      .filter(tab => !tab.disabled)
      .map(tab => ({...tab, active: tab.id === currentSettings.activeTab}));
    if (tabs.length > 0) {
      const ipcSender = event.sender;
      tabManager.addTabs(ipcSender)(tabs);
    } else {
      eventBus.emit(APP_EVENTS.settingsOpenDialog);
    }
  });
  eventBus.on(APP_EVENTS.activateTab, (_event, data) => activateTab(data.id));
  eventBus.on(APP_EVENTS.canNotify, (event, tabId) => {
    event.returnValue = tabManager.canNotify(tabId);
  });
  eventBus.on(APP_EVENTS.notificationClick, (_event, {tabId}) => {
    tabContainer.webContents.send(APP_EVENTS.activateTabInContainer, {tabId});
    eventBus.emit(APP_EVENTS.restore);
    activateTab(tabId);
  });
  eventBus.on(APP_EVENTS.reload, handleTabReload);
  eventBus.on(APP_EVENTS.tabReorder, handleTabReorder);
  eventBus.on(APP_EVENTS.zoomIn, handleZoomIn);
  eventBus.on(APP_EVENTS.zoomOut, handleZoomOut);
  eventBus.on(APP_EVENTS.zoomReset, handleZoomReset);
};

const initDesktopCapturerHandler = () => {
  eventBus.handle(APP_EVENTS.desktopCapturerGetSources, (_event, opts) => desktopCapturer.getSources(opts));
};

const appMenuOpen = () => {
  const {width, height} = mainWindow.getContentBounds();
  mainWindow.addBrowserView(appMenu);
  appMenu.setBounds({x: 0, y: 0, width, height});
};

const appMenuClose = () => {
  if (!mainWindow.getBrowserViews().find(bv => bv.isAppMenu)) {
    return;
  }
  mainWindow.removeBrowserView(appMenu);
  activateTab(tabManager.getActiveTab());
};

const fullscreenToggle = () => {
  mainWindow.setFullScreen(!mainWindow.isFullScreen());
};

const closeDialog = () => {
  if (mainWindow.getBrowserViews().length > 1) {
    return;
  }
  const dialogView = mainWindow.getBrowserView();
  activateTab(tabManager.getActiveTab());
  dialogView.webContents.destroy();
};

const handleWindowClose = event => {
  event.preventDefault();
  const {closeButtonBehavior} = loadSettings();
  if (closeButtonBehavior === CLOSE_BUTTON_BEHAVIORS.minimize) {
    mainWindow.minimize();
    // Inconsistent tray icon behaviors across platforms make it impossible to provide a consistent experience
    // to hide the app from the task bar and just show it on the tray (mainWindow.hide()).
    // Therefore, we minimize the window instead (always visible in the taskbar).
    return false;
  }
  app.exit();
  return true;
};

const saveSettings = (_event, settings) => {
  updateSettings(settings);
  loadDictionaries();
  nativeTheme.themeSource = settings.theme;
  const currentBrowserView = mainWindow.getBrowserView();
  mainWindow.removeBrowserView(currentBrowserView);
  tabManager.removeAll();
  const viewsToDestroy = [currentBrowserView, tabContainer];
  viewsToDestroy.forEach(view => view.webContents.destroy());
  tabContainer = newTabContainer();
  eventBus.emit(APP_EVENTS.trayInit);
};

const initGlobalListeners = () => {
  eventBus.on(APP_EVENTS.aboutOpenDialog, openAboutDialog);
  eventBus.on(APP_EVENTS.appMenuOpen, appMenuOpen);
  eventBus.on(APP_EVENTS.appMenuClose, appMenuClose);
  eventBus.on(APP_EVENTS.closeDialog, closeDialog);
  eventBus.handle(APP_EVENTS.dictionaryGetAvailable, getAvailableDictionaries);
  eventBus.handle(APP_EVENTS.dictionaryGetAvailableNative, getAvailableNativeDictionaries);
  eventBus.handle(APP_EVENTS.dictionaryGetEnabled, getEnabledDictionaries);
  eventBus.on(APP_EVENTS.fullscreenToggle, fullscreenToggle);
  eventBus.on(APP_EVENTS.helpOpenDialog, openHelpDialog(mainWindow));
  eventBus.on(APP_EVENTS.quit, app.exit);
  eventBus.on(APP_EVENTS.restore, () => {
    mainWindow.restore();
    mainWindow.show();
  });
  eventBus.handle(APP_EVENTS.settingsLoad, loadSettings);
  eventBus.on(APP_EVENTS.settingsOpenDialog, openSettingsDialog(mainWindow));
  eventBus.on(APP_EVENTS.settingsSave, saveSettings);
  eventBus.on(APP_EVENTS.tabSwitchToPosition, handleTabSwitchToPosition);
  eventBus.on(APP_EVENTS.tabTraverseNext, handleTabTraverse(tabManager.getNextTab));
  eventBus.on(APP_EVENTS.tabTraversePrevious, handleTabTraverse(tabManager.getPreviousTab));
  eventBus.on(APP_EVENTS.trayInit, initTray);
};

const browserVersionsReady = () => {
  app.userAgentFallback = userAgentForView(mainWindow);
  tabContainer = newTabContainer();
  appMenu = newAppMenu();
  eventBus.emit(APP_EVENTS.trayInit);
};

const init = () => {
  fixUserDataLocation();
  loadDictionaries();
  const {width = 800, height = 600, theme} = loadSettings();
  nativeTheme.themeSource = theme;
  mainWindow = new BrowserWindow({
    width, height, resizable: true, maximizable: true,
    icon: path.resolve(__dirname, '..', 'assets', getPlatform() === 'linux' ? 'icon.png' : 'icon.ico'),
    webPreferences
  });
  mainWindow.removeMenu();
  ['resize', 'maximize']
    .forEach(event => mainWindow.on(event, handleMainWindowResize));
  mainWindow.on('close', handleWindowClose);
  initTabListener();
  initDesktopCapturerHandler();
  initGlobalListeners();
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

module.exports = {
  init, ...require('./quit')
};
