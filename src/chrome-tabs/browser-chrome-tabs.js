/* eslint-disable no-undef */
const $chromeTabs = document.querySelector('.chrome-tabs');
const chromeTabs = new ChromeTabs();

chromeTabs.init($chromeTabs);

const tabsReady = () => window.ipcRenderer.send('tabsReady', {});
const addTabs = tabs => {
  tabs.forEach(({id, title, favicon = true}) => chromeTabs.addTab({id, title, favicon}));
  const activeTabMeta = tabs.find(({active}) => active === true);
  if (activeTabMeta) {
    const activeTabId = activeTabMeta.id;
    const activeTabEl = chromeTabs.tabEls.find(tabEl => tabEl.dataset.tabId === activeTabId);
    chromeTabs.setCurrentTab(activeTabEl);
    window.ipcRenderer.send('activateTab', {id: activeTabId});
  }
};
document.addEventListener('DOMContentLoaded', () => {
  tabsReady();
  window.ipcRenderer.on('addTabs', (event, data) => addTabs(data));
});


$chromeTabs.addEventListener('activeTabChange', ({detail}) => {
  window.ipcRenderer.send('activateTab', {id: detail.tabEl.dataset.tabId});
});
// $chromeTabs.addEventListener('tabAdd', ({ detail }) => console.log('Tab added', detail.tabEl));
// $chromeTabs.addEventListener('tabRemove', ({ detail }) => console.log('Tab removed', detail.tabEl));

// document.querySelector('button[data-add-background-tab]').addEventListener('click', () => {
//     chromeTabs.addTab({
//         title: 'New Tab',
//         favicon: false
//     }, {
//         background: true
//     });
// });
//
// document.querySelector('button[data-remove-tab]').addEventListener('click', () => {
//     chromeTabs.removeTab(chromeTabs.activeTabEl);
// });


window.addEventListener('keydown', event => {
  if (event.ctrlKey && event.key === 't') {
    chromeTabs.addTab({
      title: 'New Tab',
      favicon: false
    });
  }
});

