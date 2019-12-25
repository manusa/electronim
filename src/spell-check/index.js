const simpleSpellChecker = require('simple-spellchecker');

let dictionary;

simpleSpellChecker.getDictionary('en-US', (err, loadedDictionary) => {
  dictionary = loadedDictionary;
});

const getSuggestions = mispelled => {
  const ret = [];
  if (dictionary) {
    ret.push(...dictionary.getSuggestions(mispelled));
  }
  return ret;
};

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
  initSpellChecker, contextMenuHandler
};
