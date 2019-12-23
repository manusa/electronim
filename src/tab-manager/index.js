const {BrowserView, shell} = require('electron');
const settings = require('../settings');
let activeTab = null;
const tabs = {};

const webPreferences = {
  preload: `${__dirname}/preload.js`
};

const handleRedirect = browserView => (e, url) => {
  if (new URL(url).origin !== new URL(browserView.webContents.getURL()).origin) {
    e.preventDefault();
    shell.openExternal(url);
  }
};

const handlePageTitleUpdated = (ipcSender, tabId) => (e, title) => {
  ipcSender.send('setTabTitle', {id: tabId, title: title});
};

const extractFavicon = async browserView => {
  let favicons = await browserView.webContents
    .executeJavaScript('Array.from(document.querySelectorAll(\'link[rel="shortcut icon"]\')).map(el => el.href)');
  if (favicons.length === 0) {
    favicons = await browserView.webContents
      .executeJavaScript('Array.from(document.querySelectorAll(\'link[rel*="icon"]\')).map(el => el.href)');
  }
  return favicons;
};

const handlePageFaviconUpdated = (browserView, ipcSender, tabId) => async (e, favicons) => {
  if (favicons.length === 0) {
    favicons = await extractFavicon(browserView);
  }
  if (favicons.length > 0) {
    ipcSender.send('setTabFavicon', {id: tabId, favicon: favicons[favicons.length - 1]});
  }
};

const addTabs = ipcSender => tabsMetadata => {
  tabsMetadata.forEach(({id, url}) => {
    const tab = new BrowserView({webPreferences});
    tab.setAutoResize({width: true, height: true});

    tab.webContents.loadURL(url);

    const handleRedirectForCurrentUrl = handleRedirect(tab);
    tab.webContents.on('will-navigate', handleRedirectForCurrentUrl);
    tab.webContents.on('new-window', handleRedirectForCurrentUrl);

    const handlePageTitleUpdatedForCurrentTab = handlePageTitleUpdated(ipcSender, id);
    tab.webContents.on('page-title-updated', handlePageTitleUpdatedForCurrentTab);
    const handlePageFaviconUpdatedForCurrentTab = handlePageFaviconUpdated(tab, ipcSender, id);
    tab.webContents.on('page-favicon-updated', handlePageFaviconUpdatedForCurrentTab);

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
