const simpleSpellChecker = require('simple-spellchecker');

let dictionary;

simpleSpellChecker.getDictionary(navigator.language, (err, loadedDictionary) => {
  dictionary = loadedDictionary;
});

const initSpellChecker = webFrame => {
  webFrame.setSpellCheckProvider(navigator.language, {
    spellCheck (words, callback) {
      setTimeout(() => {
        const misspelled = words.filter(x => !dictionary.spellCheck(x));
        callback(misspelled);
      }, 0);
    }
  });
};

module.exports = {
  initSpellChecker
};
