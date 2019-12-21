const {app} = require('electron');
const main = require('./main');

app.setName('ElectronIM');

app.on('ready', function () {
    const mainWindow = main.init();
});

