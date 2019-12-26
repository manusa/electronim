const {BrowserView, Menu, MenuItem} = require('electron');
const {openSettingsDialog} = require('../settings');

const TABS_CONTAINER_HEIGHT = 46;

const webPreferences = {
  preload: `${__dirname}/preload.js`,
  partition: 'persist:electronim'
};

const handleContextMenu = (mainWindow, browserView) => (event, params) => {
  const {webContents} = browserView;
  const menu = new Menu();
  menu.append(new MenuItem({label: 'Settings', click: () => openSettingsDialog(mainWindow)}));
  menu.append(new MenuItem({label: 'DevTools', click: () => webContents.openDevTools()}));
  const {x, y} = params;
  menu.popup({x, y});
};

const initTabContainer = mainWindow => {
  const tabContainer = new BrowserView({webPreferences});
  mainWindow.addBrowserView(tabContainer);
  tabContainer.setAutoResize({width: true, horizontal: true});
  tabContainer.webContents.loadURL(`file://${__dirname}/index.html`);
  tabContainer.webContents.on('context-menu', handleContextMenu(mainWindow, tabContainer));
  return tabContainer;
};

module.exports = {
  TABS_CONTAINER_HEIGHT, initTabContainer
};
