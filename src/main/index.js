const {BrowserWindow, ipcMain: ipc} = require('electron');
const {APP_EVENTS} = require('../constants');
const {TABS_CONTAINER_HEIGHT, initTabContainer} = require('../chrome-tabs');
const {loadSettings, updateSettings, openSettingsDialog} = require('../settings');
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
};

const closeSettings = () => {
  const settingsView = mainWindow.getBrowserView();
  activateTab(tabManager.getActiveTab());
  settingsView.destroy();
};

const handleSaveSettings = (event, {tabs, dictionaries}) => {
  const currentSettings = loadSettings();
  const currentTabUrls = currentSettings.tabs.map(({url}) => url);
  updateSettings({enabledDictionaries: [...dictionaries]});
  if (JSON.stringify(tabs.sort()) !== JSON.stringify(currentTabUrls.sort())) {
    tabManager.removeAll();
    const updatedTabs = [];
    updatedTabs.push(...currentSettings.tabs.filter(tab => tabs.includes(tab.url)));
    tabs.filter(url => !currentTabUrls.includes(url)).forEach(url => updatedTabs.push({id: url, url}));
    updateSettings({tabs: [...updatedTabs]});
    if (!updatedTabs.map(({id}) => id).includes(currentSettings.activeTab)) {
      updateSettings({activeTab: updatedTabs[0].id});
    }
    const viewsToDestroy = [mainWindow.getBrowserView(), tabContainer];
    tabContainer = initTabContainer(mainWindow);
    viewsToDestroy.forEach(view => view.destroy());
  } else {
    closeSettings();
    tabManager.reload();
  }
};

const initSettingsListener = () => {
  ipc.on(APP_EVENTS.settingsSave, handleSaveSettings);
  ipc.on(APP_EVENTS.settingsCancel, closeSettings);
};

const init = () => {
  const {width = 800, height = 600} = loadSettings();
  mainWindow = new BrowserWindow({
    width, height, resizable: true, maximizable: false, webPreferences
  });
  mainWindow.removeMenu();
  mainWindow.on('resize', () => {
    const [currentWidth, currentHeight] = mainWindow.getSize();
    updateSettings({width: currentWidth, height: currentHeight});
  });
  initTabListener();
  initSettingsListener();
  tabContainer = initTabContainer(mainWindow);
  return mainWindow;
};

module.exports = {APP_EVENTS, init};
