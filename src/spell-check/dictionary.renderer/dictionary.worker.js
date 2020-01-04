const Nodehun = require('nodehun');
const {loadSettings} = require('../../settings');

const dictionaries = [];

const isMisspelled = word =>
  dictionaries.every(dictionary => !dictionary.spellSync(word));

window.getMisspelled = words => {
  if (dictionaries.length === 0) {
    return [];
  }
  return words.filter(isMisspelled);
};

window.getSuggestions = word => {
  const ret = new Set();
  dictionaries.map(dictionary => dictionary.suggestSync(word))
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
        dictionary = require(`dictionary-${dictionaryKey.toLowerCase()}`);
      } catch (error) {
        // Error is ignored
      }
      if (dictionary) {
        dictionary((err, {aff, dic}) => {
          dictionaries.push(new Nodehun(aff, dic));
        });
      }
    });
};

