require('../main/preload');
const {webFrame} = require('electron');
const {initSpellChecker} = require('./browser-spell-check');

initSpellChecker(webFrame);
