const {BrowserWindow, BrowserView, ipcMain: ipc} = require('electron');
const TABS_CONTAINER_HEIGHT = 46;

let mainWindow;
let tabContainer;

const tabs = {};
const addTab = (ipcSender, {id, title, url}) => {
    ipcSender.send('addTab', {
        id, title
    });
    const tab = new BrowserView();
    tab.setAutoResize({width: true, height: true});
    tab.webContents.loadURL(url);
    tabs[id.toString()] = tab;
    return tab;
};
const activateTab = tabId => {
    mainWindow.setBrowserView(tabContainer);
    const activeTab = tabs[tabId.toString()];
    const {width, height} = mainWindow.getContentBounds();
    activeTab.setBounds({x: 0, y: TABS_CONTAINER_HEIGHT, width, height: height - TABS_CONTAINER_HEIGHT});
    mainWindow.addBrowserView(activeTab);
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
        addTab(event.sender, {
            id: 1,
            title: 'GitHub',
            url: 'https://github.com'
        });
        addTab(event.sender, {
            id: 2,
            title: 'Google',
            url: 'https://google.com'
        });
        activateTab(2)
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