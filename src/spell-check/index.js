const {BrowserWindow, ipcMain: ipc} = require('electron');
const nspell = require('nspell');
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

global.dictionaries = {
  activeDictionaries: []
};

const getEnabledDictionaries = () => loadSettings().enabledDictionaries;

const loadDictionaries = () => {
  if (fakeRendererWorker) {
    fakeRendererWorker.destroy();
  }
  global.dictionaries.activeDictionaries = [];
  fakeRendererWorker = new BrowserWindow({
    show: false,
    webPreferences: {nodeIntegration: true}
  });
  fakeRendererWorker.loadURL(`file://${__dirname}/load-dictionary.renderer/index.html`);
  ipc.handle('dictionaryLoaded', async (event, {dictionary}) => {
    global.dictionaries.activeDictionaries = [...global.dictionaries.activeDictionaries, nspell(dictionary)];
  });
  // ipc.on('dictionaryLoaded', (event, {nspellDictionary, dictionary}) => {
  //   // global.dictionaries.activeDictionaries = [...global.dictionaries.activeDictionaries, nspellDictionary];
  //   setTimeout(
  //     () => global.dictionaries.activeDictionaries = [...global.dictionaries.activeDictionaries, nspell(dictionary)], 0);
  // });
  fakeRendererWorker.webContents.openDevTools();
  // const loadDictionaryWorker = workerFarm(require.resolve('./load-dictionary.worker.js'));
  // global.dictionaries.activeDictionaries.length = 0;
  // getEnabledDictionaries()
  //   .filter(dictionaryKey => AVAILABLE_DICTIONARIES.includes(dictionaryKey))
  //   .forEach(dictionaryKey => {
  //     setTimeout(() => {
  //       require(`dictionary-${dictionaryKey}`)((err, dict) => {
  //         global.dictionaries.push(nspell(dict));
  //       });
  //     }, 0);
  //     // loadDictionaryWorker(dictionaryKey, (aff, dic) => {
  //     //   // global.activeDictionaries.push(nspell(Buffer.from(aff.data), Buffer.from(dic.data)));
  //     // });
  //   });
};

const getSuggestions = word => {
  const ret = new Set();
  global.dictionaries.activeDictionaries.map(dictionary => dictionary.suggest(word))
    .flatMap(suggestions => suggestions)
    .forEach(suggestion => ret.add(suggestion));
  return Array.from(ret.values()).sort().slice(0, 10);
};

const contextMenuHandler = (event, {misspelledWord}, webContents) => {
  const {MenuItem} = require('electron');
  const ret = [];
  if (misspelledWord && misspelledWord.length > 0) {
    getSuggestions(misspelledWord).forEach(suggestion =>
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
