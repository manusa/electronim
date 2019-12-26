require('../main/preload');
const {AVAILABLE_DICTIONARIES, getEnabledDictionaries} = require('../spell-check');

window.dictionaries = {
  available: AVAILABLE_DICTIONARIES,
  enabled: getEnabledDictionaries()
};
