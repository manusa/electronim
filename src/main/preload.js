const {ipcRenderer} = require('electron');
const {APP_EVENTS} = require('../constants');

window.ipcRenderer = ipcRenderer;
window.APP_EVENTS = APP_EVENTS;
