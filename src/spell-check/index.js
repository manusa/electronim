const {BrowserWindow, ipcMain} = require('electron');
const {APP_EVENTS} = require('../constants');
const {loadSettings} = require('../settings');

const AVAILABLE_DICTIONARIES = {
  ca: {
    name: 'Catalan'
  },
  'ca-valencia': {
    name: 'Valencian'
  },
  de: {
    name: 'German'
  },
  'en-GB': {
    name: 'English (GB)'
  },
  'en-US': {
    name: 'English (US)'
  },
  es: {
    name: 'Spanish'
  },
  eu: {
    name: 'Basque'
  },
  fr: {
    name: 'French'
  },
  it: {
    name: 'Italian'
  },
  ka: {
    name: 'Georgian'
  },
  lt: {
    name: 'Lithuanian'
  },
  nl: {
    name: 'Dutch'
  },
  pl: {
    name: 'Polish'
  },
  pt: {
    name: 'Portuguese'
  },
  'pt-BR': {
    name: 'Portuguese (Brazil)'
  },
  ru: {
    name: 'Russian'
  },
  sv: {
    name: 'Swedish'
  },
  tr: {
    name: 'Turkish'
  },
  uk: {
    name: 'Ukrainian'
  }
};

let fakeRendererWorker;

const handleGetMisspelled = async (event, words) =>
  await fakeRendererWorker.webContents.executeJavaScript(`getMisspelled(${JSON.stringify(words)})`);

const getEnabledDictionaries = () => loadSettings().enabledDictionaries;

const loadDictionaries = () => {
  if (!fakeRendererWorker) {
    fakeRendererWorker = new BrowserWindow({
      show: false,
      webPreferences: {nodeIntegration: true}
    });
    ipcMain.handle(APP_EVENTS.dictionaryGetMisspelled, handleGetMisspelled);
  }
  fakeRendererWorker.loadURL(`file://${__dirname}/dictionary.renderer/index.html`);
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


module.exports = {
  AVAILABLE_DICTIONARIES, contextMenuHandler, getEnabledDictionaries, loadDictionaries
};
