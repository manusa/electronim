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
/* eslint-disable no-undef */
const chromeTabs = new ChromeTabs();

const getTab = tabId => chromeTabs.tabEls.find(tabEl => tabEl.dataset.tabId === tabId);

const tabsReady = () => ipcRenderer.send(APP_EVENTS.tabsReady, {});

const addTabs = (event, tabs) => {
  tabs.forEach(({id, title = id, favicon = false}) => chromeTabs.addTab({id, title, favicon}));
  const activeTabMeta = tabs.find(({active}) => active === true);
  if (activeTabMeta) {
    const activeTabId = activeTabMeta.id;
    chromeTabs.setCurrentTab(getTab(activeTabId));
    ipcRenderer.send(APP_EVENTS.activateTab, {id: activeTabId});
  }
};

const doForTab = (tabId, func) => {
  const tab = getTab(tabId);
  if (tab) {
    func(tab);
  }
};

const setActiveTab = (event, {tabId}) => {
  chromeTabs.setCurrentTab(getTab(tabId));
};

const setTabTitle = (event, {id, title}) => doForTab(id, tab =>
  tab.querySelectorAll('.chrome-tab-title').forEach(element => {
    element.innerText = title;
    element.title = title;
  }));

const setTabFavicon = (event, {id, favicon}) => doForTab(id, tab =>
  tab.querySelectorAll('.chrome-tab-favicon').forEach(element => {
    element.style.backgroundImage = `url('${favicon}')`;
    element.removeAttribute('hidden', '');
  }));

const init = () => {
  const $chromeTabs = document.querySelector('.chrome-tabs');
  chromeTabs.init($chromeTabs);

  const $settingsButton = document.querySelector('.settings__button');
  $settingsButton.addEventListener('click', () => ipcRenderer.send(APP_EVENTS.settingsOpenDialog));

  ipcRenderer.on(APP_EVENTS.activateTabInContainer, setActiveTab);
  ipcRenderer.on(APP_EVENTS.addTabs, addTabs);
  ipcRenderer.on(APP_EVENTS.setTabTitle, setTabTitle);
  ipcRenderer.on(APP_EVENTS.setTabFavicon, setTabFavicon);
  document.addEventListener('DOMContentLoaded', tabsReady);

  $chromeTabs.addEventListener('activeTabChange', ({detail}) => {
    ipcRenderer.send(APP_EVENTS.activateTab, {id: detail.tabEl.dataset.tabId});
  });

  $chromeTabs.addEventListener('tabReorder', () => {
    ipcRenderer.send(APP_EVENTS.tabReorder, {tabIds: chromeTabs.tabEls.map(tabEl => tabEl.dataset.tabId)});
  });
};

// $chromeTabs.addEventListener('tabAdd', ({ detail }) => console.log('Tab added', detail.tabEl));
// $chromeTabs.addEventListener('tabRemove', ({ detail }) => console.log('Tab removed', detail.tabEl));
init();

