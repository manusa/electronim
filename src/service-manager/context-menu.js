/*
   Copyright 2022 Marc Nuri San Felix

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
const {Menu, MenuItem, clipboard, ipcMain: eventBus, shell} = require('electron');
const {contextMenuHandler, contextMenuNativeHandler} = require('../spell-check');
const {APP_EVENTS} = require('../constants');

const entries = ({webContents, params}) => {
  return [
    [{
      label: 'Back',
      enabled: webContents.navigationHistory.canGoBack(),
      click: () => webContents.navigationHistory.goBack()
    }, {
      label: 'Reload',
      click: () => webContents.reload()
    }, {
      label: 'Find in Page',
      click: () => eventBus.emit(APP_EVENTS.findInPageOpen)
    }], [{
      label: 'Cut',
      visible: params.editFlags.canCut,
      click: () => webContents.cut()
    }, {
      label: 'Copy',
      visible: params.editFlags.canCopy && !params.linkURL,
      click: () => webContents.copy()
    }, {
      label: 'Copy image',
      visible: params.mediaType === 'image',
      click: () => webContents.copyImageAt(params.x, params.y)
    }, {
      label: 'Paste',
      visible: params.editFlags.canPaste,
      click: () => webContents.paste()
    }], [{
      label: 'Copy link address',
      visible: !!params.linkURL,
      click: () => clipboard.writeText(params.linkURL)
    }, {
      label: 'Copy link text',
      visible: !!params.linkURL && !!params.linkText,
      click: () => clipboard.writeText(params.linkText)
    }, {
      label: 'Open link in external browser',
      visible: !!params.linkURL,
      click: () => shell.openExternal(params.linkURL)
    }], [{
      label: 'DevTools',
      click: () => webContents.openDevTools()
    }]
  ];
};

const spellCheckContextMenu = async ({webContents, params}) => {
  const menu = new Menu();
  let spellingSuggestions;
  if (webContents.session.spellcheck) {
    spellingSuggestions = contextMenuNativeHandler(webContents, params);
  } else {
    spellingSuggestions = await contextMenuHandler(webContents, params);
  }
  if (spellingSuggestions && spellingSuggestions.length > 0) {
    for (const mi of spellingSuggestions) {
      menu.append(mi);
    }
  }
  return menu;
};

const regularContextMenu = ({webContents, params}) => {
  const menu = new Menu();
  const isVisible = me => !Object.keys(me).includes('visible') || me.visible === true;
  const allEntries = entries({webContents, params});
  for (let idx = 0; idx < allEntries.length; idx++) {
    const group = allEntries[idx];
    for (const entry of group) {
      menu.append(new MenuItem({...entry}));
    }
    if (group.some(isVisible) && idx < allEntries.length - 1) {
      menu.append(new MenuItem({type: 'separator'}));
    }
  }
  return menu;
};

/**
 * @param {Electron.CrossProcessExports.WebContentsView|WebContentsView} viewOrWindow
 * @returns {(function(*, *): Promise<void>)|*}
 */
const handleContextMenu = viewOrWindow => async (_event, params) => {
  const {webContents} = viewOrWindow;
  let menu;
  if (params.misspelledWord) {
    menu = await spellCheckContextMenu({webContents, params});
  } else {
    menu = regularContextMenu({webContents, params});
  }
  const {x, y} = params;
  menu.popup({x: x + 1, y: y + 1});
};

module.exports = {handleContextMenu};
