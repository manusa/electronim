const simpleSpellChecker = require('simple-spellchecker');
const {loadSettings} = require('../settings');

const AVAILABLE_DICTIONARIES = [
  'en-GB',
  'en-US',
  'es-ES',
  'es-MX',
  'fr-FR',
  'it-IT'
];

const activeDictionaries = [];

const getEnabledDictionaries = () => loadSettings().enabledDictionaries;

const loadDictionaries = () => {
  getEnabledDictionaries().forEach(dictionaryKey =>
    simpleSpellChecker.getDictionary(dictionaryKey, (err, loadedDictionary) => {
      activeDictionaries.push(loadedDictionary);
    })
  );
};

const getSuggestions = word => {
  const ret = new Set();
  activeDictionaries.map(dictionary => dictionary.checkAndSuggest(word))
    .flatMap(({misspelled, suggestions}) => (misspelled ? suggestions : []))
    .forEach(suggestion => ret.add(suggestion));
  return Array.from(ret.values());
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

const getActiveDictionariesSnapshot = () => activeDictionaries;

loadDictionaries();
module.exports = {
  AVAILABLE_DICTIONARIES, contextMenuHandler, getEnabledDictionaries, getActiveDictionariesSnapshot
};
