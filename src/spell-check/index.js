const {BrowserWindow, ipcMain} = require('electron');
const {APP_EVENTS} = require('../constants');
const {loadSettings} = require('../settings');

const AVAILABLE_DICTIONARIES = [
  'ca', //
  'ca-valencia', //
  'de',
  'en-gb',
  'en-us',
  'es',
  'eu', //
  'fr',
  'it',
  'ka',
  'lt',
  'nl',
  'pl',
  'pt',
  'pt-br',
  'ru',
  'sv',
  'tr',
  'uk'
];

let fakeRendererWorker;

const getEnabledDictionaries = () => loadSettings().enabledDictionaries;

const loadDictionaries = () => {
  if (!fakeRendererWorker) {
    fakeRendererWorker = new BrowserWindow({
      show: false,
      webPreferences: {nodeIntegration: true}
    });
  }
  fakeRendererWorker.loadURL(`file://${__dirname}/dictionary.renderer/index.html`);
  fakeRendererWorker.webContents.openDevTools();
};

const contextMenuHandler = async (event, {misspelledWord}, webContents) => {
  const {MenuItem} = require('electron');
  const ret = [];
  if (misspelledWord && misspelledWord.length > 0) {
    const suggestions = await fakeRendererWorker.webContents.executeJavaScript(`getSuggestions('${misspelledWord}')`);
    suggestions.forEach(suggestion =>
      ret.push(new MenuItem({
        label: suggestion,
        click: () => {
          webContents.replaceMisspelling(suggestion);
        }
      }))
    );
  }
  return ret;
};

ipcMain.handle(APP_EVENTS.dictionaryGetMispelled, async (event, words) =>
  await fakeRendererWorker.webContents.executeJavaScript(`getMisspelled(${JSON.stringify(words)})`));

module.exports = {
  AVAILABLE_DICTIONARIES, contextMenuHandler, getEnabledDictionaries, loadDictionaries
};
