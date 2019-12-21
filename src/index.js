const { app} = require('electron');
const main = require('./main');

app.setName('electronim');

app.on('ready', function () {
    const mainWindow = main.init();
});

