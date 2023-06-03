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
const {Menu, MenuItem} = require('electron');
const {contextMenuHandler, contextMenuNativeHandler} = require('../spell-check');

const entries = ({webContents, params}) => {
  return [
    [{
      label: 'Back',
      enabled: webContents.canGoBack(),
      click: () => webContents.goBack()
    }, {
      label: 'Reload',
      click: () => webContents.reload()
    }], [{
      label: 'Cut',
      visible: params.editFlags.canCut,
      click: () => webContents.cut()
    }, {
      label: 'Copy',
      visible: params.editFlags.canCopy,
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
    spellingSuggestions.forEach(mi => menu.append(mi));
  }
  return menu;
};

const regularContextMenu = ({webContents, params}) => {
  const menu = new Menu();
  const isVisible = me => !Object.keys(me).includes('visible') || me.visible === true;
  entries({webContents, params}).forEach((group, idx, arr) => {
    for (const entry of group) {
      menu.append(new MenuItem({...entry}));
    }
    if (group.filter(isVisible).length > 0 && idx < arr.length - 1) {
      menu.append(new MenuItem({type: 'separator'}));
    }
  });
  return menu;
};

/**
 * @param {BrowserView|BrowserWindow} viewOrWindow
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
  menu.popup({x, y});
};

module.exports = {handleContextMenu};
