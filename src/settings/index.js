const fs = require('fs');
const path = require('path');
const HOME_DIR = require('os').homedir();
const APP_DIR = '.electronim';
const SETTINGS_FILE = 'settings.json';

const appDir = path.join(HOME_DIR, APP_DIR);
const settingsPath = path.join(appDir, SETTINGS_FILE);

const initAppDir = () => {
    fs.mkdirSync(appDir, {recursive: true});
};

const loadSettings = () => {
    initAppDir();
    if (fs.existsSync(settingsPath)) {
        return JSON.parse(fs.readFileSync(settingsPath));
    }
    return {};
};

const writeSettings = settings => {
    initAppDir();
    fs.writeFileSync(settingsPath, JSON.stringify(settings));
};

const updateSettings = settings => {
    writeSettings({...loadSettings(), ...settings})
};

module.exports = {loadSettings, updateSettings};