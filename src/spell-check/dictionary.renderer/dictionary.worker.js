const fs = require('fs');
const Nodehun = require('nodehun');
const path = require('path');
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
      // let dictionary;
      const dicPath = path.join(__dirname, '..', '..', 'third-party', 'hunspell-dictionaries', `${dictionaryKey}.dic`);
      if (fs.existsSync(dicPath)) {
        const aff = fs.readFileSync(
          path.join(__dirname, '..', '..', 'third-party', 'hunspell-dictionaries', `${dictionaryKey}.aff`));
        const dic = fs.readFileSync(dicPath);
        console.log(`loading: ${dictionaryKey}`);
        dictionaries.push(new Nodehun(aff, dic));
      }
    });
};

