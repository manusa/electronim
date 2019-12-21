const {BrowserView} = require('electron');
const settings = require('../settings/index');
let activeTab = null;
const tabs = [];

const addTab = ipcSender => ({id, title, url}) => {
    ipcSender.send('addTab', {
        id, title
    });
    const tab = new BrowserView();
    tab.setAutoResize({width: true, height: true});
    tab.webContents.loadURL(url);
    tabs[id.toString()] = tab;
    return tab;
};

const getTab = tabId => tabs[tabId.toString()];
const setActiveTab = tabId => {
    activeTab = tabId.toString();
    settings.updateSettings({activeTab});
};


module.exports = {
    addTab, getTab, setActiveTab
};