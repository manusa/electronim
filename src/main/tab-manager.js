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

const extractFavicon = async browerView => {
  let favicons = await browerView.webContents
    .executeJavaScript('Array.from(document.querySelectorAll(\'link[rel="shortcut icon"]\')).map(el => el.href)');
  if (favicons.length === 0) {
    favicons = await browerView.webContents
      .executeJavaScript('Array.from(document.querySelectorAll(\'link[rel*="icon"]\')).map(el => el.href)');
  }
  return favicons;
};

const pollTabs = ipcSender => {
  setInterval(() => {
    // eslint-disable-next-line no-console
    Object.entries(tabs).forEach(async ([tabId, tabView]) => {
      ipcSender.send('setTabTitle', {id: tabId, title: tabView.webContents.getTitle()});
      const favicons = await extractFavicon(tabView);
      if (favicons.length > 0) {
        ipcSender.send('setTabFavicon', {id: tabId, favicon: favicons[0]});
      }
    });
  }, 1000);
};

module.exports = {
  addTabs, getTab, setActiveTab, pollTabs
};
