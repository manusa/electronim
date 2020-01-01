/* eslint-disable no-undef */
const {remote} = require('electron');

const getActiveDictionaries = () => remote.getGlobal('dictionaries').activeDictionaries;

const isMisspelled = word =>
  getActiveDictionaries().every(dictionary => !dictionary.correct(word));

const initSpellChecker = webFrame => {
  webFrame.setSpellCheckProvider(navigator.language, {
    spellCheck (words, callback) {
      if (getActiveDictionaries().length > 0) {
        setTimeout(() => {
          const misspelled = words.filter(isMisspelled);
          callback(misspelled);
        }, 0);
      }
    }
  });
};

module.exports = {initSpellChecker};
