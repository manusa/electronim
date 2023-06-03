/*
   Copyright 2019 Marc Nuri San Felix

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
const {BrowserWindow, MenuItem, ipcMain} = require('electron');
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

const getAvailableDictionaries = () => AVAILABLE_DICTIONARIES;

const getAvailableNativeDictionaries = () =>
  fakeRendererWorker?.webContents.session.availableSpellCheckerLanguages ?? [];

const handleGetMisspelled = async (_event, words) =>
  fakeRendererWorker.webContents.executeJavaScript(`getMisspelled(${JSON.stringify(words)})`);

const getUseNativeSpellChecker = () => loadSettings().useNativeSpellChecker;

const getEnabledDictionaries = () => loadSettings().enabledDictionaries;

const loadDictionaries = () => {
  if (fakeRendererWorker) {
    fakeRendererWorker.destroy();
  }
  fakeRendererWorker = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: false,
      nativeWindowOpen: true,
      nodeIntegration: true
    }
  });
  fakeRendererWorker.loadURL(`file://${__dirname}/dictionary.renderer/index.html`);
  ipcMain.removeHandler(APP_EVENTS.dictionaryGetMisspelled);
  ipcMain.handle(APP_EVENTS.dictionaryGetMisspelled, handleGetMisspelled);
  // Uncomment to debug problems with dictionaries
  // fakeRendererWorker.webContents.openDevTools();
};

const menuItem = ({webContents, suggestion}) => new MenuItem({
  label: suggestion,
  click: () => {
    webContents.replaceMisspelling(suggestion);
  }
});

const contextMenuHandler = async (webContents, {misspelledWord}) => {
  const ret = [];
  if (misspelledWord && misspelledWord.length > 0) {
    const suggestions = await fakeRendererWorker.webContents.executeJavaScript(`getSuggestions('${misspelledWord}')`);
    suggestions.forEach(suggestion =>
      ret.push(menuItem({webContents, suggestion})));
  }
  return ret;
};

const contextMenuNativeHandler = (webContents, {misspelledWord, dictionarySuggestions = []}) => {
  const ret = [];
  if (misspelledWord && misspelledWord.length > 0) {
    dictionarySuggestions.forEach(suggestion =>
      ret.push(menuItem({webContents, suggestion})));
  }
  return ret;
};

module.exports = {
  AVAILABLE_DICTIONARIES,
  contextMenuHandler,
  contextMenuNativeHandler,
  getAvailableDictionaries,
  getAvailableNativeDictionaries,
  getEnabledDictionaries,
  getUseNativeSpellChecker,
  loadDictionaries
};
