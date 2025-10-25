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
const path = require('node:path');
const {
  BaseWindow, Notification, app, desktopCapturer, ipcMain: eventBus, nativeTheme
} = require('electron');
const {APP_EVENTS, CLOSE_BUTTON_BEHAVIORS, appNameOrDefault} = require('../constants');
const {openAboutDialog} = require('../about');
const {newAppMenu, isNotAppMenu} = require('../app-menu');
const {findDialog, initKeyboardEvents} = require('../base-window');
const {TABS_CONTAINER_HEIGHT, newTabContainer, isNotTabContainer} = require('../chrome-tabs');
const {
  FIND_IN_PAGE_HEIGHT, FIND_IN_PAGE_WIDTH, isFindInPage, isNotFindInPage, findInPage, findInPageOpen, findInPageClose
} = require('../find-in-page');
const {openHelpDialog} = require('../help');
const {
  getPlatform, loadSettings, updateSettings, openSettingsDialog, exportSettings, importSettings, openElectronimFolder
} = require('../settings');
const {
  getAvailableDictionaries, getAvailableNativeDictionaries, loadDictionaries, getEnabledDictionaries
} = require('../spell-check');
const serviceManager = require('../service-manager');
const {openTaskManagerDialog} = require('../task-manager');
const {initTray} = require('../tray');
const {initBrowserVersions, userAgentForWebContents} = require('../user-agent');

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
  eventBus.emit(APP_EVENTS.findInPageClose);
  const currentViews = mainWindow.contentView.children;
  for (const view of currentViews.filter(isNotTabContainer)) {
    mainWindow.contentView.removeChildView(view);
  }
  if (mainWindow.contentView.children.length === 0) {
    mainWindow.contentView.addChildView(tabContainer);
  }
};

const activateService = ({tabId, restoreWindow = true}) => {
  const activeService = serviceManager.getService(tabId);
  if (activeService) {
    const {width, height} = mainWindow.getContentBounds();
    resetMainWindow();
    mainWindow.contentView.addChildView(activeService);
    tabContainer.setBounds({x: 0, y: 0, width, height: TABS_CONTAINER_HEIGHT});
    activeService.setBounds({x: 0, y: TABS_CONTAINER_HEIGHT, width, height: height - TABS_CONTAINER_HEIGHT});
    serviceManager.setActiveService(tabId);
    if (restoreWindow) {
      activeService.webContents.focus();
    }
  }
};

const handleMainWindowResize = () => {
  const [windowWidth, windowHeight] = mainWindow.getSize();
  updateSettings({width: windowWidth, height: windowHeight});

  setTimeout(() => {
    const {width: contentWidth, height: contentHeight} = mainWindow.getContentBounds();
    if (appMenu?.setBounds ?? false) {
      appMenu.setBounds({x: 0, y: 0, width: contentWidth, height: contentHeight});
    }
    for (const view of mainWindow.contentView.children.filter(isFindInPage)) {
      view.setBounds({
        x: contentWidth - FIND_IN_PAGE_WIDTH, y: 0, width: FIND_IN_PAGE_WIDTH, height: FIND_IN_PAGE_HEIGHT
      });
    }
    let totalHeight = 0;
    const filteredViews = mainWindow.contentView.children
      .filter(isNotAppMenu)
      .filter(isNotFindInPage);
    const isLast = idx => idx === filteredViews.length - 1;
    for (const [idx, bv] of filteredViews.entries()) {
      const {x: currentX, y: currentY, height: currentHeight} = bv.getBounds();
      let newHeight = currentHeight;
      if (isLast(idx)) {
        newHeight = contentHeight - totalHeight;
      }
      bv.setBounds({x: currentX, y: currentY, width: contentWidth, height: newHeight});
      totalHeight += currentHeight;
    }
    const dialogView = findDialog(mainWindow);
    if (dialogView) {
      dialogView.setBounds({x: 0, y: 0, width: contentWidth, height: contentHeight});
    }
  });
};

const handleTabReload = event => event.sender.reloadIgnoringCache();

const handleSpecificTabReload = (_event, {tabId}) => {
  const tab = serviceManager.getService(tabId);
  if (tab) {
    tab.webContents.reloadIgnoringCache();
  }
};

const handleTabTraverse = getTabIdFunction => () => {
  if (mainWindow.contentView.children.length === 1) {
    return;
  }
  const tabId = getTabIdFunction();
  tabContainer.webContents.send(APP_EVENTS.activateServiceInContainer, {tabId});
  activateService({tabId});
};

const handleTabSwitchToPosition = tabPosition => {
  handleTabTraverse(() => serviceManager.getServiceAt(tabPosition))();
};

const handleZoomIn = event => event.sender.setZoomFactor(event.sender.getZoomFactor() + 0.1);

const handleZoomOut = event => {
  const newFactor = event.sender.getZoomFactor() - 0.1;
  if (newFactor >= 0.1) {
    event.sender.setZoomFactor(newFactor);
  }
};

const handleZoomReset = event => event.sender.setZoomFactor(1);

const handleServicesReorder = (_event, {tabIds: visibleTabIds}) => {
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
  serviceManager.sortServices(visibleTabIds);
  updateSettings({tabs});
};

const handleSetServiceDisableNotifications = (_event, {id, disableNotifications}) => {
  const currentSettings = loadSettings();
  const tabs = currentSettings.tabs.map(tab => {
    if (tab.id === id) {
      return {...tab, disableNotifications};
    }
    return tab;
  });
  updateSettings({tabs});

  // Relay the event to the UI
  tabContainer.webContents.send(APP_EVENTS.setServiceDisableNotifications, {
    id,
    disableNotifications
  });
};

const initTabListener = () => {
  eventBus.on(APP_EVENTS.servicesReady, event => {
    const currentSettings = loadSettings();
    const tabs = currentSettings.tabs
      .filter(tab => !tab.disabled)
      .map(tab => ({...tab, active: tab.id === currentSettings.activeTab}));
    if (tabs.length > 0) {
      const ipcSender = event.sender;
      serviceManager.addServices(ipcSender)(tabs);
    } else {
      eventBus.emit(APP_EVENTS.settingsOpenDialog);
    }
  });
  eventBus.on(APP_EVENTS.activateService, (_event, data) => {
    activateService({tabId: data.id, restoreWindow: data.restoreWindow});
  });
  eventBus.on(APP_EVENTS.canNotify, (event, tabId) => {
    event.returnValue = serviceManager.canNotify(tabId);
  });
  eventBus.on(APP_EVENTS.notificationClick, (_event, {tabId}) => {
    tabContainer.webContents.send(APP_EVENTS.activateServiceInContainer, {tabId});
    eventBus.emit(APP_EVENTS.restore);
    activateService({tabId});
  });
  eventBus.on(APP_EVENTS.reload, handleTabReload);
  eventBus.on(APP_EVENTS.reloadTab, handleSpecificTabReload);
  eventBus.on(APP_EVENTS.servicesReorder, handleServicesReorder);
  eventBus.on(APP_EVENTS.setServiceDisableNotifications, handleSetServiceDisableNotifications);
  eventBus.on(APP_EVENTS.zoomIn, handleZoomIn);
  eventBus.on(APP_EVENTS.zoomOut, handleZoomOut);
  eventBus.on(APP_EVENTS.zoomReset, handleZoomReset);
};

const initDesktopCapturerHandler = () => {
  eventBus.handle(APP_EVENTS.desktopCapturerGetSources, (_event, opts) => desktopCapturer.getSources(opts));
};

const appMenuOpen = () => {
  const {width, height} = mainWindow.getContentBounds();
  mainWindow.contentView.addChildView(appMenu);
  appMenu.setBounds({x: 0, y: 0, width, height});
};

const appMenuClose = () => {
  if (!mainWindow.contentView.children.some(view => view.isAppMenu)) {
    return;
  }
  mainWindow.contentView.removeChildView(appMenu);
  activateService({tabId: serviceManager.getActiveService()});
};

const fullscreenToggle = () => {
  mainWindow.setFullScreen(!mainWindow.isFullScreen());
};

const closeDialog = () => {
  const dialogView = findDialog(mainWindow);
  if (!dialogView) {
    return;
  }
  mainWindow.contentView.removeChildView(dialogView);
  activateService({tabId: serviceManager.getActiveService()});
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
  mainWindow.setAlwaysOnTop(settings.alwaysOnTop);
  mainWindow.setTitle(appNameOrDefault(settings.applicationTitle));
  closeDialog();
  appMenuClose();
  findInPageClose();
  for (const view of mainWindow.contentView.children) {
    mainWindow.contentView.removeChildView(view);
    view.webContents.destroy();
  }
  serviceManager.removeAll();
  tabContainer = newTabContainer();
  eventBus.emit(APP_EVENTS.keyboardEventsInit);
  eventBus.emit(APP_EVENTS.trayInit);
};

const initGlobalListeners = () => {
  eventBus.on(APP_EVENTS.aboutOpenDialog, openAboutDialog(mainWindow));
  eventBus.on(APP_EVENTS.appMenuOpen, appMenuOpen);
  eventBus.on(APP_EVENTS.appMenuClose, appMenuClose);
  eventBus.on(APP_EVENTS.closeDialog, closeDialog);
  eventBus.handle(APP_EVENTS.dictionaryGetAvailable, getAvailableDictionaries);
  eventBus.handle(APP_EVENTS.dictionaryGetAvailableNative, getAvailableNativeDictionaries);
  eventBus.handle(APP_EVENTS.dictionaryGetEnabled, getEnabledDictionaries);
  eventBus.on(APP_EVENTS.escape, () => {
    if (mainWindow.contentView.children.some(isFindInPage)) {
      eventBus.emit(APP_EVENTS.findInPageClose);
    } else {
      eventBus.emit(APP_EVENTS.appMenuClose);
      eventBus.emit(APP_EVENTS.closeDialog);
    }
  });
  eventBus.on(APP_EVENTS.findInPage, findInPage(mainWindow));
  eventBus.on(APP_EVENTS.findInPageOpen, findInPageOpen(mainWindow));
  eventBus.on(APP_EVENTS.findInPageClose, findInPageClose(mainWindow));
  eventBus.on(APP_EVENTS.fullscreenToggle, fullscreenToggle);
  eventBus.on(APP_EVENTS.helpOpenDialog, openHelpDialog(mainWindow));
  eventBus.on(APP_EVENTS.keyboardEventsInit, initKeyboardEvents);
  eventBus.on(APP_EVENTS.quit, app.exit);
  eventBus.on(APP_EVENTS.restore, () => {
    mainWindow.restore();
    mainWindow.show();
  });
  eventBus.handle(APP_EVENTS.settingsLoad, loadSettings);
  eventBus.on(APP_EVENTS.settingsOpenDialog, openSettingsDialog(mainWindow));
  eventBus.on(APP_EVENTS.settingsSave, saveSettings);
  eventBus.handle(APP_EVENTS.settingsExport, exportSettings(mainWindow));
  eventBus.handle(APP_EVENTS.settingsImport, importSettings(mainWindow));
  eventBus.handle(APP_EVENTS.settingsOpenFolder, openElectronimFolder);
  eventBus.on(APP_EVENTS.tabSwitchToPosition, handleTabSwitchToPosition);
  eventBus.on(APP_EVENTS.tabTraverseNext, handleTabTraverse(serviceManager.getNextService));
  eventBus.on(APP_EVENTS.tabTraversePrevious, handleTabTraverse(serviceManager.getPreviousService));
  eventBus.on(APP_EVENTS.taskManagerOpenDialog, openTaskManagerDialog(mainWindow, serviceManager));
  eventBus.on(APP_EVENTS.trayInit, initTray);
};

const browserVersionsReady = () => {
  tabContainer = newTabContainer();
  appMenu = newAppMenu();
  app.userAgentFallback = userAgentForWebContents(appMenu.webContents);
  eventBus.emit(APP_EVENTS.keyboardEventsInit);
  eventBus.emit(APP_EVENTS.trayInit);
};

const init = () => {
  fixUserDataLocation();
  loadDictionaries();
  const currentSettings = loadSettings();
  const {width = 800, height = 600, startMinimized, alwaysOnTop, theme, applicationTitle} = currentSettings;
  app.name = appNameOrDefault(applicationTitle);
  nativeTheme.themeSource = theme;
  mainWindow = new BaseWindow({
    width, height, resizable: true, maximizable: true,
    alwaysOnTop,
    title: appNameOrDefault(applicationTitle),
    icon: path.resolve(__dirname, '..', 'assets', getPlatform() === 'linux' ? 'icon.png' : 'icon.ico'),
    show: false, paintWhenInitiallyHidden: false,
    webPreferences
  });
  if (startMinimized) {
    mainWindow.showInactive();
    mainWindow.minimize();
  } else {
    mainWindow.show();
  }
  mainWindow.removeMenu();
  for (const event of ['resize', 'maximize', 'restore']) {
    mainWindow.on(event, handleMainWindowResize);
  }
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
