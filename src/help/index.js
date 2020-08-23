/*
   Copyright 2019 Marc Nuri San Felix

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
const {BrowserView} = require('electron');
const fs = require('fs');
const path = require('path');
const md = require('markdown-it')({html: true, xhtmlOut: true});
const {handleRedirect} = require('../tab-manager/redirect');
const {showDialog} = require('../browser-window');

const DOCS_DIR = path.resolve(__dirname, '../../docs');

const webPreferences = {
  preload: `${__dirname}/preload.js`
};

// Visible for testing
const fixRelative = s => s.replace(
  /((src|href)\s*?=\s*?['"](?!http))([^'"]+)(['"])/gi,
  `$1${DOCS_DIR}/$3$4`
);

const loadDocs = () => fs.readdirSync(DOCS_DIR)
  .filter(fileName => fileName.endsWith('.md'))
  .reduce((acc, fileName) => {
    acc[fileName] = fixRelative(md.render(fs.readFileSync(path.resolve(DOCS_DIR, fileName), 'utf8')));
    return acc;
  }, {});


const openHelpDialog = mainWindow => () => {
  const helpView = new BrowserView({webPreferences});
  helpView.webContents.loadURL(`file://${__dirname}/index.html`);
  const handleRedirectForCurrentUrl = handleRedirect(helpView);
  helpView.webContents.on('will-navigate', handleRedirectForCurrentUrl);
  helpView.webContents.on('new-window', handleRedirectForCurrentUrl);
  showDialog(mainWindow, helpView);
  helpView.webContents.openDevTools();
};

module.exports = {fixRelative, openHelpDialog, loadDocs};
