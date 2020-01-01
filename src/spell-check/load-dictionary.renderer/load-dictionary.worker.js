const {remote, ipcRenderer} = require('electron');
// const nspell = require('nspell');
const {loadSettings} = require('../../settings');

const getDictionaries = () => remote.getGlobal('dictionaries');
const load = () => {
  getDictionaries().activeDictionaries = [];
  loadSettings().enabledDictionaries
    .forEach(dictionaryKey => {
      const dictionary = require(`dictionary-${dictionaryKey}`);
      if (dictionary) {
        dictionary((err, dict) => {
          // ipcRenderer.send('dictionaryLoaded', {nspellDictionary: nspell(dict)});
          const nspell = require('nspell');
          // ipcRenderer.send('dictionaryLoaded', {dictionary: dict});
          ipcRenderer.invoke('dictionaryLoaded', {dictionary: dict});
          // getDictionaries().activeDictionaries = [...getDictionaries().activeDictionaries, nspell(dict)];
        });
      }
    });
};

module.exports = load;
