const {BrowserWindow, BrowserView, ipcMain: ipc} = require('electron');
const tabManager = require('./tab-manager');
const settings = require('../settings');
const TABS_CONTAINER_HEIGHT = 46;

let mainWindow;
let tabContainer;

const activateTab = tabId => {
    if (tabManager.getTab(tabId)) {
        mainWindow.setBrowserView(tabContainer);
        tabManager.setActiveTab(tabId);
        const activeTab = tabManager.getTab(tabId.toString());
        const {width, height} = mainWindow.getContentBounds();
        activeTab.setBounds({x: 0, y: TABS_CONTAINER_HEIGHT, width, height: height - TABS_CONTAINER_HEIGHT});
        mainWindow.addBrowserView(activeTab);
    }
};

const addTabContainer = () => {
    tabContainer = new BrowserView({
        webPreferences: {
            preload: `${__dirname}/preload.js`
        }
    });
    mainWindow.addBrowserView(tabContainer);
    const {width} = mainWindow.getContentBounds();
    tabContainer.setBounds({x: 0, y: 0, width, height: TABS_CONTAINER_HEIGHT});
    tabContainer.setAutoResize({width: true, horizontal: true});
    return tabContainer.webContents.loadURL(`file://${__dirname}/../chrome-tabs/index.html`);
};

const initTabListener = () => {
    ipc.on('tabsReady', (event, data) => {
        const addTab = tabManager.addTab(event.sender);
        const currentSettings = settings.loadSettings();
        currentSettings.tabs.forEach(addTab);
        activateTab(currentSettings.activeTab);
    });
    ipc.on('activateTab', (event, data) => activateTab(data.id));
};

const init = () => {
    mainWindow = new BrowserWindow({
        width: 800, height: 600, resizable: true, maximizable: false,
        webPreferences: {
            webviewTag: true,
            preload: `${__dirname}/preload.js`
        }
    });
    // mainWindow.loadURL('file://' + __dirname + '/tab-panel/index.html');
    mainWindow.on('ready-to-show', function () {
        mainWindow.show();
        mainWindow.focus();
    });
    initTabListener();
    addTabContainer();
    return mainWindow;
};

module.exports = {init};