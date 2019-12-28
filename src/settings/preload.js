require('../main/preload');
const {AVAILABLE_DICTIONARIES, getEnabledDictionaries} = require('../spell-check');
const {loadSettings} = require('./');

const settings = loadSettings();

window.dictionaries = {
  available: AVAILABLE_DICTIONARIES,
  enabled: getEnabledDictionaries()
};

window.tabs = [...settings.tabs];
