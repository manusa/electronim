/* eslint-disable no-undef */
const $chromeTabs = document.querySelector('.chrome-tabs');
const chromeTabs = new ChromeTabs();

chromeTabs.init($chromeTabs);

const getTab = tabId => chromeTabs.tabEls.find(tabEl => tabEl.dataset.tabId === tabId);

const tabsReady = () => window.ipcRenderer.send('tabsReady', {});

const addTabs = tabs => {
  tabs.forEach(({id, title = id, favicon = false}) => chromeTabs.addTab({id, title, favicon}));
  const activeTabMeta = tabs.find(({active}) => active === true);
  if (activeTabMeta) {
    const activeTabId = activeTabMeta.id;
    const activeTabEl = getTab(activeTabId);
    chromeTabs.setCurrentTab(activeTabEl);
    window.ipcRenderer.send('activateTab', {id: activeTabId});
  }
};

const doForTab = (tabId, func) => {
  const tab = getTab(tabId);
  if (tab) {
    func(tab);
  }
};

const setTabTitle = ({id, title}) => doForTab(id, tab =>
  tab.querySelectorAll('.chrome-tab-title').forEach(element => {
    element.innerText = title;
    element.title = title;
  }));

const setTabFavicon = ({id, favicon}) => doForTab(id, tab =>
  tab.querySelectorAll('.chrome-tab-favicon').forEach(element => {
    element.style.backgroundImage = `url('${favicon}')`;
    element.removeAttribute('hidden', '');
  }));

window.ipcRenderer.on('addTabs', (event, data) => addTabs(data));
window.ipcRenderer.on('setTabTitle', (event, data) => setTabTitle(data));
window.ipcRenderer.on('setTabFavicon', (event, data) => setTabFavicon(data));
document.addEventListener('DOMContentLoaded', tabsReady);

$chromeTabs.addEventListener('activeTabChange', ({detail}) => {
  window.ipcRenderer.send('activateTab', {id: detail.tabEl.dataset.tabId});
});

// $chromeTabs.addEventListener('tabAdd', ({ detail }) => console.log('Tab added', detail.tabEl));
// $chromeTabs.addEventListener('tabRemove', ({ detail }) => console.log('Tab removed', detail.tabEl));


