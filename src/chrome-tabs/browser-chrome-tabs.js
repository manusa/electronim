/* eslint-disable no-undef */
const chromeTabs = new ChromeTabs();

const getTab = tabId => chromeTabs.tabEls.find(tabEl => tabEl.dataset.tabId === tabId);

const tabsReady = () => ipcRenderer.send(APP_EVENTS.tabsReady, {});

const addTabs = (event, tabs) => {
  tabs.forEach(({id, title = id, favicon = false}) => chromeTabs.addTab({id, title, favicon}));
  const activeTabMeta = tabs.find(({active}) => active === true);
  if (activeTabMeta) {
    const activeTabId = activeTabMeta.id;
    const activeTabEl = getTab(activeTabId);
    chromeTabs.setCurrentTab(activeTabEl);
    ipcRenderer.send(APP_EVENTS.activateTab, {id: activeTabId});
  }
};

const doForTab = (tabId, func) => {
  const tab = getTab(tabId);
  if (tab) {
    func(tab);
  }
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

