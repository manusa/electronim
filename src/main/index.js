const {BrowserWindow, app, ipcMain: ipc} = require('electron');
const {APP_EVENTS} = require('../constants');
const {TABS_CONTAINER_HEIGHT, initTabContainer} = require('../chrome-tabs');
const {loadSettings, updateSettings, updateTabs, openSettingsDialog} = require('../settings');
const {loadDictionaries} = require('../spell-check');
const tabManager = require('../tab-manager');

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
    tabContainer.setBounds({x: 0, y: 0, width, height: TABS_CONTAINER_HEIGHT});
    mainWindow.setBrowserView(tabContainer);
    tabManager.setActiveTab(tabId);
    activeTab.setBounds({x: 0, y: TABS_CONTAINER_HEIGHT, width, height: height - TABS_CONTAINER_HEIGHT});
    mainWindow.addBrowserView(activeTab);
  }
};

const handleTabReorder = (event, {tabIds}) => {
  const currentTabs = loadSettings().tabs.reduce((acc, tab) => {
    acc[tab.id] = tab; return acc;
  }, {});
  const tabs = tabIds.map(tabId => currentTabs[tabId]);
  updateSettings({tabs});
};

const initTabListener = () => {
  ipc.on(APP_EVENTS.tabsReady, event => {
    const currentSettings = loadSettings();
    const tabs = currentSettings.tabs.map(tab => ({...tab, active: tab.id === currentSettings.activeTab}));
    if (tabs.length > 0) {
      tabManager.addTabs(event.sender)(tabs);
      event.sender.send(APP_EVENTS.activateTab, {tabId: currentSettings.activeTab});
    } else {
      openSettingsDialog(mainWindow);
    }
  });
  ipc.on(APP_EVENTS.activateTab, (event, data) => activateTab(data.id));
  ipc.on(APP_EVENTS.settingsOpenDialog, () => openSettingsDialog(mainWindow));
  ipc.on(APP_EVENTS.tabReorder, handleTabReorder);
};

const closeSettings = () => {
  const settingsView = mainWindow.getBrowserView();
  activateTab(tabManager.getActiveTab());
  settingsView.destroy();
};

const saveSettings = (event, {tabs, dictionaries}) => {
  updateSettings({enabledDictionaries: [...dictionaries]});
  updateTabs(tabs);
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
  tabContainer = initTabContainer(mainWindow);
  return mainWindow;
};

module.exports = {APP_EVENTS, init};
