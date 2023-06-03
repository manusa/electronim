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
const {app, BrowserView, session} = require('electron');
const path = require('path');
const {APP_EVENTS} = require('../constants');
const {loadSettings, updateSettings} = require('../settings');
const {getEnabledDictionaries, getUseNativeSpellChecker} = require('../spell-check');
const {userAgentForView, addUserAgentInterceptor} = require('../user-agent');
const {handleContextMenu} = require('./context-menu');
const {handleRedirect, windowOpenHandler} = require('./redirect');

let activeTab = null;
const tabs = {};

const webPreferences = {
  contextIsolation: false,
  nativeWindowOpen: true,
  nodeIntegration: false,
  sandbox: true,
  preload: path.resolve(__dirname, '..', '..', 'bundles', 'tab-manager.preload.js')
};

const handlePageTitleUpdated = (ipcSender, tabId) => (_e, title) => {
  ipcSender.send(APP_EVENTS.setTabTitle, {id: tabId, title: title});
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

const handlePageFaviconUpdated = (browserView, ipcSender, tabId) => async (_e, favicons = []) => {
  if (favicons.length === 0) {
    favicons = await extractFavicon(browserView);
  }
  if (favicons.length > 0) {
    ipcSender.send(APP_EVENTS.setTabFavicon, {id: tabId, favicon: favicons[favicons.length - 1]});
  }
};

// Required for Service Workers -> https://github.com/electron/electron/issues/16196
const setGlobalUserAgentFallback = userAgent => (app.userAgentFallback = userAgent);

const cleanUserAgent = browserView => {
  const validUserAgent = userAgentForView(browserView);
  browserView.webContents.userAgent = validUserAgent;
  setGlobalUserAgentFallback(validUserAgent);
};

const addTabs = ipcSender => tabsMetadata => {
  const useNativeSpellChecker = getUseNativeSpellChecker();
  const enabledDictionaries = getEnabledDictionaries();
  tabsMetadata.forEach(({id, url, sandboxed = false}) => {
    const tabPreferences = {...webPreferences};
    if (sandboxed) {
      tabPreferences.session = session.fromPartition(`persist:${id}`, {cache: true});
    } else {
      tabPreferences.session = session.defaultSession;
    }
    addUserAgentInterceptor(tabPreferences.session);

    tabPreferences.session.spellcheck = useNativeSpellChecker;
    if (useNativeSpellChecker) {
      tabPreferences.session.setSpellCheckerEnabled(true);
      tabPreferences.session.setSpellCheckerLanguages(tabPreferences.session.availableSpellCheckerLanguages
        .filter(lang => enabledDictionaries.includes(lang)));
    }


    tabPreferences.experiment = false;
    if (tabPreferences.experiment) { // USE NATIVE SPELL CHECKER
      tabPreferences.session.setSpellCheckerDictionaryDownloadURL('file:///home/user/00-MN/projects/manusa/electronim/dictionaries/');
    }
    const tab = new BrowserView({webPreferences: tabPreferences});
    tab.setAutoResize({width: false, horizontal: false, height: false, vertical: false});

    cleanUserAgent(tab);
    tab.webContents.loadURL(url);

    tab.webContents.on('will-navigate', handleRedirect(tab));
    tab.webContents.setWindowOpenHandler(windowOpenHandler(tab));

    const handlePageTitleUpdatedForCurrentTab = handlePageTitleUpdated(ipcSender, id);
    tab.webContents.on('page-title-updated', handlePageTitleUpdatedForCurrentTab);
    const handlePageFaviconUpdatedForCurrentTab = handlePageFaviconUpdated(tab, ipcSender, id);
    tab.webContents.on('page-favicon-updated', handlePageFaviconUpdatedForCurrentTab);

    tab.webContents.on('context-menu', handleContextMenu(tab));

    const registerIdInTab = () => tab.webContents.executeJavaScript(`window.tabId = '${id}';`);
    tab.webContents.on('dom-ready', registerIdInTab);
    registerIdInTab().then();

    tabs[id.toString()] = tab;
  });
  ipcSender.send(APP_EVENTS.addTabs, tabsMetadata);
};

const getTab = tabId => (tabId ? tabs[tabId.toString()] : null);

const getActiveTab = () => activeTab;

const setActiveTab = tabId => {
  activeTab = tabId.toString();
  updateSettings({activeTab});
};

const getTabTraverse = operation => () => {
  const tabIds = Object.keys(tabs);
  const idx = operation(tabIds.indexOf(getActiveTab()));
  if (idx < 0) {
    return tabIds[tabIds.length - 1];
  } else if (idx >= tabIds.length) {
    return tabIds[0];
  }
  return tabIds[idx];
};

const getNextTab = getTabTraverse(idx => idx + 1);
const getPreviousTab = getTabTraverse(idx => idx - 1);
const getTabAt = position => {
  const tabIds = Object.keys(tabs);
  const idx = position - 1;
  if (idx > 0 && idx < tabIds.length) {
    return tabIds[idx];
  } else if (idx < 1) {
    return tabIds[0];
  }
  return tabIds[tabIds.length - 1];
};

const removeAll = () => {
  Object.values(tabs).forEach(browserView => browserView.webContents.destroy());
  Object.keys(tabs).forEach(key => delete tabs[key]);
};

const reload = () => Object.values(tabs).forEach(browserView => browserView.webContents.reload());

const canNotify = tabId => {
  const {tabs: tabsSettings, disableNotificationsGlobally} = loadSettings();
  const currentTab = tabsSettings.find(tab => tab.id === tabId);
  if (disableNotificationsGlobally === true) {
    return false;
  }
  return currentTab ? !currentTab.disableNotifications : true;
};

module.exports = {
  addTabs, getTab, getTabAt, getActiveTab, setActiveTab, getNextTab, getPreviousTab, canNotify, reload, removeAll
};
