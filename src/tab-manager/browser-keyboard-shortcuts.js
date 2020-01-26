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
/* eslint-disable no-undef */
const {ipcRenderer} = require('electron');

const codeActionMap = {
  F5: APP_EVENTS.reload
};

const controlCodeActionMap = {
  r: APP_EVENTS.reload,
  R: APP_EVENTS.reload
};

const commandCodeActionMap = {
  r: APP_EVENTS.reload,
  R: APP_EVENTS.reload
};

const triggerForActionMap = actionMap => key => {
  if (actionMap[key]) {
    ipcRenderer.send(actionMap[key]);
  }
};

const initKeyboardShortcuts = () => {
  const triggerCodeActionMap = triggerForActionMap(codeActionMap);
  const triggerControlCodeActionMap = triggerForActionMap(controlCodeActionMap);
  const triggerCommandCodeActionMap = triggerForActionMap(commandCodeActionMap);
  window.addEventListener('keyup', event => {
    if (event.ctrlKey === false && event.metaKey === false) {
      triggerCodeActionMap(event.key);
    } else if (event.ctrlKey === true && event.metaKey === false) {
      triggerControlCodeActionMap(event.key);
    } else if (event.ctrlKey === false && event.metaKey === true) {
      triggerCommandCodeActionMap(event.key);
    }
  });
};

module.exports = {initKeyboardShortcuts};
