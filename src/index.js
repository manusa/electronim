const {app} = require('electron');
const main = require('./main');

app.name = 'ElectronIM';

app.on('ready', main.init);
