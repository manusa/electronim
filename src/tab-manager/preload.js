require('../main/preload');
const {webFrame} = require('electron');
const {initSpellChecker} = require('../spell-check/browser-spell-check');

initSpellChecker(webFrame);
