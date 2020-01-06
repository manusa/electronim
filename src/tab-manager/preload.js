require('../main/preload');
const {webFrame} = require('electron');
require('./browser-notification-shim');
const {initSpellChecker} = require('./browser-spell-check');

initSpellChecker(webFrame);
