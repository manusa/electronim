const {webFrame} = require('electron');
const {initSpellChecker} = require('../spell-check');
initSpellChecker(webFrame);
