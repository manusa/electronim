const $chromeTabs = document.querySelector('.chrome-tabs');
const chromeTabs = new ChromeTabs();

chromeTabs.init($chromeTabs);

const tabsReady = () => window.ipcRenderer.send('tabsReady', {});
document.addEventListener('DOMContentLoaded', () => {
    tabsReady();
    window.ipcRenderer.on('addTab', (event, data) => addTab(data));
});


$chromeTabs.addEventListener('activeTabChange', ({ detail }) => {
    window.ipcRenderer.send('activateTab', {id: detail.tabEl.dataset.tabId});
});
$chromeTabs.addEventListener('tabAdd', ({ detail }) => console.log('Tab added', detail.tabEl));
$chromeTabs.addEventListener('tabRemove', ({ detail }) => console.log('Tab removed', detail.tabEl));

// document.querySelector('button[data-add-tab]').addEventListener('click', () => {
//     chromeTabs.addTab({
//         title: 'New Tab',
//         favicon: false
//     });
// });

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

const addTab = ({id, title, favicon = true}) => {
    chromeTabs.addTab({
        id,
        title,
        favicon
    });
};