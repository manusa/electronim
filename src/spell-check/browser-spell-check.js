const activeDictionaries = require('./').getActiveDictionariesSnapshot();

const isMisspelled = word =>
  activeDictionaries.every(dictionary => !dictionary.spellCheck(word));

const initSpellChecker = webFrame => {
  webFrame.setSpellCheckProvider(navigator.language, {
    spellCheck (words, callback) {
      setTimeout(() => {
        const misspelled = words.filter(isMisspelled);
        callback(misspelled);
      }, 0);
    }
  });
};

module.exports = {initSpellChecker};
