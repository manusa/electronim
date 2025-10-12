/*
   Copyright 2024 Marc Nuri San Felix

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
const path = require('node:path');
const {WebContentsView} = require('electron');
const tabManager = require('../tab-manager');
const {findDialog} = require('../base-window');
const {APP_EVENTS} = require('../constants');

const FIND_IN_PAGE_HEIGHT = 60;
const FIND_IN_PAGE_WIDTH = 400;

const webPreferences = {
  transparent: true,
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  preload: path.resolve(__dirname, '..', '..', 'bundles', 'find-in-page.preload.js')
};

/**
 * Creates a new WebContentsView instance with the Find In Page dialog
 * @returns {Electron.CrossProcessExports.WebContentsView}
 */
const newFindInPage = () => {
  const findInPage = new WebContentsView({webPreferences});
  findInPage.isFindInPage = true;
  findInPage.webContents.loadURL(`file://${__dirname}/index.html`);
  return findInPage;
};

const isFindInPage = bv => bv.isFindInPage === true;

const isNotFindInPage = bv => !isFindInPage(bv);

const findInPageOpen = mainWindow => () => {
  if (mainWindow.contentView.children.find(isFindInPage)) {
    return;
  }
  const findInPage = newFindInPage();
  const {width} = mainWindow.getContentBounds();
  mainWindow.contentView.addChildView(findInPage);
  findInPage.setBounds({x: width - FIND_IN_PAGE_WIDTH, y: 0, width: FIND_IN_PAGE_WIDTH, height: FIND_IN_PAGE_HEIGHT});
  findInPage.webContents.focus();
};

const findInPageClose = mainWindow => () => {
  tabManager.stopFindInPage();
  mainWindow.contentView.children.forEach(cv => {
    cv.webContents.stopFindInPage('clearSelection');
    cv.webContents.removeAllListeners('found-in-page');
  });
  const view = mainWindow.contentView.children.find(isFindInPage);
  if (!view) {
    return;
  }
  mainWindow.contentView.removeChildView(view);
  view.webContents.destroy();
  if (mainWindow.contentView.children.length > 0) {
    mainWindow.contentView.children.slice(-1)[0].webContents.focus();
  }
};

const findInPage = mainWindow => (event, {text, forward = true}) => {
  if (!text) {
    return;
  }
  let webContents = null;
  const dialog = findDialog(mainWindow);
  if (dialog) {
    webContents = dialog.webContents;
  } else if (tabManager.getActiveTab() && tabManager.getTab(tabManager.getActiveTab())) {
    webContents = tabManager.getTab(tabManager.getActiveTab()).webContents;
  }
  const findInPageDialog = mainWindow.contentView.children.find(isFindInPage);
  if (webContents === null || !findInPageDialog) {
    return;
  }
  if (webContents.listeners('found-in-page').length === 0) {
    webContents.on('found-in-page', (_event, result) => {
      findInPageDialog.webContents.send(APP_EVENTS.findInPageFound, result);
    });
  }
  webContents.findInPage(text, {forward});
};

module.exports = {
  FIND_IN_PAGE_HEIGHT,
  FIND_IN_PAGE_WIDTH,
  newFindInPage,
  isFindInPage,
  isNotFindInPage,
  findInPageOpen,
  findInPageClose,
  findInPage
};
