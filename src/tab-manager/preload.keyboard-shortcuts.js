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

const triggerForActionMap = actionMap => ({key}) => {
  if (actionMap[key]) {
    ipcRenderer.send(actionMap[key]);
  }
};

const triggerCode = event => triggerForActionMap({
  F5: APP_EVENTS.reload
})(event);

const triggerControlCode = event => triggerForActionMap({
  r: APP_EVENTS.reload,
  R: APP_EVENTS.reload,
  '+': APP_EVENTS.zoomIn,
  '-': APP_EVENTS.zoomOut,
  0: APP_EVENTS.zoomReset,
  Tab: APP_EVENTS.tabTraverseNext
})(event);

const triggerControlShiftCode = event => triggerForActionMap({
  Tab: APP_EVENTS.tabTraversePrevious
})(event);

const triggerCommandCode = event => triggerForActionMap({
  r: APP_EVENTS.reload,
  R: APP_EVENTS.reload
})(event);


const isPlain = event => event.ctrlKey === false && event.metaKey === false && event.shiftKey === false;
const isControl = event => event.ctrlKey === true && event.metaKey === false && event.shiftKey === false;
const isControlShift = event => event.ctrlKey === true && event.metaKey === false && event.shiftKey === true;
const isCommand = event => event.ctrlKey === false && event.metaKey === true && event.shiftKey === false;

const initKeyboardShortcuts = () => {
  window.addEventListener('keyup', event => {
    if (isPlain(event)) {
      triggerCode(event);
    } else if (isControl(event)) {
      triggerControlCode(event);
    } else if (isControlShift(event)) {
      triggerControlShiftCode(event);
    } else if (isCommand(event)) {
      triggerCommandCode(event);
    }
  });
  window.addEventListener('load', () => {
    document.addEventListener('wheel', event => {
      const ctrlOrCommand = event.ctrlKey || event.metaKey;
      if (ctrlOrCommand && event.deltaY < 0) {
        ipcRenderer.send(APP_EVENTS.zoomIn);
      } else if (ctrlOrCommand && event.deltaY > 0) {
        ipcRenderer.send(APP_EVENTS.zoomOut);
      }
    });
  });
};

module.exports = {initKeyboardShortcuts};
