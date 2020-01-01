/* eslint-disable no-undef */
const {ipcRenderer} = require('electron');

const initSpellChecker = webFrame => {
  webFrame.setSpellCheckProvider(navigator.language, {
    async spellCheck (words, callback) {
      const misspelled = await ipcRenderer.invoke(APP_EVENTS.dictionaryGetMispelled, words);
      // const misspelled = await words.filter(async word => await window.isMisspelled(word));
      callback(misspelled);
    }
  });
};

module.exports = {initSpellChecker};
