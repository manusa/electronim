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
const {app, BrowserView, Menu, MenuItem, session} = require('electron');
const path = require('path');
const {APP_EVENTS} = require('../constants');
const settings = require('../settings');
const {contextMenuHandler, contextMenuNativeHandler, getEnabledDictionaries, getUseNativeSpellChecker} = require('../spell-check');
const {userAgentForView, addUserAgentInterceptor} = require('../user-agent');
const {handleRedirect} = require('./redirect');

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

const handleContextMenu = browserView => async (event, params) => {
  const {webContents} = browserView;
  const menu = new Menu();
  let spellingSuggestions;
  if (webContents.session.spellcheck) {
    spellingSuggestions = contextMenuNativeHandler(event, params, webContents);
  } else {
    spellingSuggestions = await contextMenuHandler(event, params, webContents);
  }
  if (spellingSuggestions.length > 0) {
    spellingSuggestions.forEach(mi => menu.append(mi));
    menu.append(new MenuItem({type: 'separator'}));
  }
  menu.append(new MenuItem({label: 'DevTools', click: () => webContents.openDevTools()}));
  const {x, y} = params;
  menu.popup({x, y});
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
    tab.setAutoResize({width: true, height: true});

    cleanUserAgent(tab);
    tab.webContents.loadURL(url);

    const handleRedirectForCurrentUrl = handleRedirect(tab);
    tab.webContents.on('will-navigate', handleRedirectForCurrentUrl);
    tab.webContents.on('new-window', handleRedirectForCurrentUrl);

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
  settings.updateSettings({activeTab});
};

const removeAll = () => {
  Object.values(tabs).forEach(browserView => browserView.webContents.destroy());
  Object.keys(tabs).forEach(key => delete tabs[key]);
};

const reload = () => Object.values(tabs).forEach(browserView => browserView.webContents.reload());

const canNotify = tabId => {
  const {tabs: tabsSettings, disableNotificationsGlobally} = settings.loadSettings();
  const currentTab = tabsSettings.find(tab => tab.id === tabId);
  if (disableNotificationsGlobally === true) {
    return false;
  }
  return currentTab ? !currentTab.disableNotifications : true;
};

module.exports = {
  addTabs, getTab, getActiveTab, setActiveTab, canNotify, reload, removeAll
};
