const loadDictionaryWorker = (dictionaryKey, callback) => {
  require(`dictionary-${dictionaryKey}`)((err, dict) => {
    callback(dict.aff, dict.dic);
  });
};

module.exports = loadDictionaryWorker;
