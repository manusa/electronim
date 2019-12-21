const {BrowserView} = require('electron');
const settings = require('../settings');
let activeTab = null;
const tabs = {};

const addTabs = ipcSender => tabsMetadata => {
  tabsMetadata.forEach(({id, url}) => {
    const tab = new BrowserView();
    tab.setAutoResize({width: true, height: true});
    tab.webContents.loadURL(url);
    tabs[id.toString()] = tab;
  });
  ipcSender.send('addTabs', tabsMetadata);
};

const getTab = tabId => (tabId ? tabs[tabId.toString()] : null);

const setActiveTab = tabId => {
  activeTab = tabId.toString();
  settings.updateSettings({activeTab});
};

module.exports = {
  addTabs, getTab, setActiveTab
};
