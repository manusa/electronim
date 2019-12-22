const {BrowserWindow, BrowserView, ipcMain: ipc} = require('electron');
const tabManager = require('./tab-manager');
const settings = require('../settings');
const TABS_CONTAINER_HEIGHT = 46;

const webPreferences = {
  preload: `${__dirname}/preload.js`,
  partition: 'persist:electronim'
};

let mainWindow;
let tabContainer;

const activateTab = tabId => {
  const activeTab = tabManager.getTab(tabId.toString());
  if (activeTab) {
    mainWindow.setBrowserView(tabContainer);
    tabManager.setActiveTab(tabId);
    const {width, height} = mainWindow.getContentBounds();
    activeTab.setBounds({x: 0, y: TABS_CONTAINER_HEIGHT, width, height: height - TABS_CONTAINER_HEIGHT});
    mainWindow.addBrowserView(activeTab);
  }
};

const addTabContainer = () => {
  tabContainer = new BrowserView({webPreferences});
  mainWindow.addBrowserView(tabContainer);
  const {width} = mainWindow.getContentBounds();
  tabContainer.setBounds({x: 0, y: 0, width, height: TABS_CONTAINER_HEIGHT});
  tabContainer.setAutoResize({width: true, horizontal: true});
  return tabContainer.webContents.loadURL(`file://${__dirname}/../chrome-tabs/index.html`);
};

const initTabListener = () => {
  ipc.on('tabsReady', event => {
    const currentSettings = settings.loadSettings();
    const tabs = currentSettings.tabs.map(tab => ({...tab, active: tab.id === currentSettings.activeTab}));
    tabManager.addTabs(event.sender)(tabs);
    event.sender.send('activateTab', {tabId: currentSettings.activeTab});
    tabManager.pollTabs(event.sender);
  });
  ipc.on('activateTab', (event, data) => activateTab(data.id));
};

const init = () => {
  const {width = 800, height = 600} = settings.loadSettings();
  mainWindow = new BrowserWindow({
    width, height, resizable: true, maximizable: false, webPreferences
  });
  mainWindow.removeMenu();
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });
  mainWindow.on('resize', () => {
    const [currentWidth, currentHeight] = mainWindow.getSize();
    settings.updateSettings({width: currentWidth, height: currentHeight});
  });
  initTabListener();
  addTabContainer();
  return mainWindow;
};

module.exports = {init};
