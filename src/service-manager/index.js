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
const {app, WebContentsView, session} = require('electron');
const path = require('node:path');
const {APP_EVENTS} = require('../constants');
const {loadSettings, updateSettings} = require('../settings');
const {getEnabledDictionaries, getUseNativeSpellChecker} = require('../spell-check');
const {userAgentForWebContents, addUserAgentInterceptor} = require('../user-agent');
const {handleContextMenu} = require('./context-menu');
const {handleRedirect, windowOpenHandler} = require('./redirect');

let activeService = null;
const services = {};

const defaultWebPreferences = {
  contextIsolation: false,
  nativeWindowOpen: true,
  nodeIntegration: false,
  sandbox: true,
  preload: path.resolve(__dirname, '..', '..', 'bundles', 'service-manager.preload.js')
};

const handlePageTitleUpdated = (ipcSender, serviceId) => (_e, title) => {
  ipcSender.send(APP_EVENTS.setServiceTitle, {id: serviceId, title: title});
};

const extractFavicon = async view => {
  let favicons = await view.webContents
    .executeJavaScript('Array.from(document.querySelectorAll(\'link[rel="shortcut icon"]\')).map(el => el.href)');
  if (favicons.length === 0) {
    favicons = await view.webContents
      .executeJavaScript('Array.from(document.querySelectorAll(\'link[rel*="icon"]\')).map(el => el.href)');
  }
  return favicons;
};

const handlePageFaviconUpdated = (view, ipcSender, serviceId) => async (_e, favicons = []) => {
  if (favicons.length === 0) {
    favicons = await extractFavicon(view);
  }
  if (favicons.length > 0) {
    ipcSender.send(APP_EVENTS.setTabFavicon, {id: serviceId, favicon: favicons[favicons.length - 1]});
  }
};

// Required for Service Workers -> https://github.com/electron/electron/issues/16196
const setGlobalUserAgentFallback = userAgent => (app.userAgentFallback = userAgent);

const cleanUserAgent = view => {
  const validUserAgent = userAgentForWebContents(view.webContents);
  view.webContents.userAgent = validUserAgent;
  setGlobalUserAgentFallback(validUserAgent);
};

const addServices = ipcSender => servicesMetadata => {
  const useNativeSpellChecker = getUseNativeSpellChecker();
  const enabledDictionaries = getEnabledDictionaries();
  servicesMetadata.forEach(({
    id, url, sandboxed = false, openUrlsInApp = false
  }) => {
    const servicePreferences = {...defaultWebPreferences};
    if (sandboxed) {
      servicePreferences.session = session.fromPartition(`persist:${id}`, {cache: true});
    } else {
      servicePreferences.session = session.defaultSession;
    }
    addUserAgentInterceptor(servicePreferences.session);

    servicePreferences.session.spellcheck = useNativeSpellChecker;
    if (useNativeSpellChecker) {
      servicePreferences.session.setSpellCheckerEnabled(true);
      servicePreferences.session.setSpellCheckerLanguages(servicePreferences.session.availableSpellCheckerLanguages
        .filter(lang => enabledDictionaries.includes(lang)));
    }


    servicePreferences.experiment = false;
    if (servicePreferences.experiment) { // USE NATIVE SPELL CHECKER
      servicePreferences.session.setSpellCheckerDictionaryDownloadURL('file:///home/user/00-MN/projects/manusa/electronim/dictionaries/');
    }
    const service = new WebContentsView({webPreferences: servicePreferences});

    cleanUserAgent(service);
    service.webContents.loadURL(url);

    if (!openUrlsInApp) {
      service.webContents.on('will-navigate', handleRedirect(service));
      service.webContents.setWindowOpenHandler(windowOpenHandler(service));
    }

    const handlePageTitleUpdatedForCurrentService = handlePageTitleUpdated(ipcSender, id);
    service.webContents.on('page-title-updated', handlePageTitleUpdatedForCurrentService);
    const handlePageFaviconUpdatedForCurrentService = handlePageFaviconUpdated(service, ipcSender, id);
    service.webContents.on('page-favicon-updated', handlePageFaviconUpdatedForCurrentService);

    service.webContents.on('context-menu', handleContextMenu(service));

    const registerIdInDom = () => {
      service.webContents.executeJavaScript(`window.tabId = '${id}';window.serviceId = '${id}';`);
    };
    service.webContents.on('dom-ready', registerIdInDom);
    registerIdInDom();

    services[id.toString()] = service;
  });
  ipcSender.send(APP_EVENTS.addServices, servicesMetadata);
};

const sortServices = serviceIds => {
  if (serviceIds.length !== Object.keys(services).length) {
    // Skip in case there are inconsistencies
    console.error(`Inconsistent service state, skipping sort operation (${serviceIds.length} !== ${Object.keys(services).length}).`);
    return;
  }
  const oldServices = {...services};
  // Clean previous state
  Object.keys(services).forEach(key => delete services[key]);
  // Set the services with the correct ordering
  for (const serviceId of serviceIds) {
    services[serviceId] = oldServices[serviceId];
  }
};

const getService = serviceId => (serviceId ? services[serviceId.toString()] : null);

const getActiveService = () => activeService;

const setActiveService = serviceId => {
  activeService = serviceId.toString();
  updateSettings({activeTab: activeService});
};

const traverseFunction = operation => () => {
  const serviceIds = Object.keys(services);
  const idx = operation(serviceIds.indexOf(getActiveService()));
  if (idx < 0) {
    return serviceIds[serviceIds.length - 1];
  } else if (idx >= serviceIds.length) {
    return serviceIds[0];
  }
  return serviceIds[idx];
};

const getNextService = traverseFunction(idx => idx + 1);
const getPreviousService = traverseFunction(idx => idx - 1);
const getServiceAt = position => {
  const serviceIds = Object.keys(services);
  const idx = position - 1;
  if (idx > 0 && idx < serviceIds.length) {
    return serviceIds[idx];
  } else if (idx < 1) {
    return serviceIds[0];
  }
  return serviceIds[serviceIds.length - 1];
};

const removeAll = () => {
  Object.values(services).forEach(view => view.webContents.destroy());
  Object.keys(services).forEach(key => delete services[key]);
};

const reload = () => Object.values(services).forEach(view => view.webContents.reload());

const stopFindInPage = () => Object.values(services).forEach(view => {
  view.webContents.stopFindInPage('clearSelection');
  view.webContents.removeAllListeners('found-in-page');
});

const canNotify = tabId => {
  const {tabs: tabsSettings, disableNotificationsGlobally} = loadSettings();
  const currentTab = tabsSettings.find(tab => tab.id === tabId);
  if (disableNotificationsGlobally === true) {
    return false;
  }
  return currentTab ? !currentTab.disableNotifications : true;
};

module.exports = {
  addServices,
  sortServices,
  getService,
  getServiceAt,
  getActiveService,
  setActiveService,
  getNextService,
  getPreviousService,
  canNotify,
  reload,
  removeAll,
  stopFindInPage
};
