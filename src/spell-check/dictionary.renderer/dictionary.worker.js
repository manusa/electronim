const nspell = require('nspell');
const {loadSettings} = require('../../settings');

const dictionaries = [];

const isMisspelled = word =>
  dictionaries.every(dictionary => !dictionary.correct(word));

window.getMisspelled = words => {
  if (dictionaries.length === 0) {
    return [];
  }
  return words.filter(isMisspelled);
};

window.getSuggestions = word => {
  const ret = new Set();
  dictionaries.map(dictionary => dictionary.suggest(word))
    .flatMap(suggestions => suggestions)
    .forEach(suggestion => ret.add(suggestion));
  return Array.from(ret.values()).sort().slice(0, 10);
};

window.reloadDictionaries = () => {
  dictionaries.length = 0;
  const {enabledDictionaries} = loadSettings();
  enabledDictionaries
    .forEach(dictionaryKey => {
      let dictionary;
      try {
        dictionary = require(`dictionary-${dictionaryKey}`);
      } catch (error) {
        // Error is ignored
      }
      if (dictionary) {
        dictionary((err, dict) => {
          dictionaries.push(nspell(dict));
        });
      }
    });
};

