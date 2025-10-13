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

const eventKey = ({key, shiftKey = false, ctrlKey = false, altKey = false, metaKey = false}) =>
  `${key}-${shiftKey}-${ctrlKey}-${altKey}-${metaKey}`;

const EVENTS = new Map();

EVENTS.set(eventKey({key: 'F5'}), () => ipcRenderer.send(APP_EVENTS.reload));
EVENTS.set(eventKey({key: 'R', ctrlKey: true}), () => ipcRenderer.send(APP_EVENTS.reload));
EVENTS.set(eventKey({key: 'r', ctrlKey: true}), () => ipcRenderer.send(APP_EVENTS.reload));
EVENTS.set(eventKey({key: 'R', metaKey: true}), () => ipcRenderer.send(APP_EVENTS.reload));
EVENTS.set(eventKey({key: 'r', metaKey: true}), () => ipcRenderer.send(APP_EVENTS.reload));
EVENTS.set(eventKey({key: '+', ctrlKey: true}), () => ipcRenderer.send(APP_EVENTS.zoomIn));
EVENTS.set(eventKey({key: '-', ctrlKey: true}), () => ipcRenderer.send(APP_EVENTS.zoomOut));
EVENTS.set(eventKey({key: '0', ctrlKey: true}), () => ipcRenderer.send(APP_EVENTS.zoomReset));

const initKeyboardShortcuts = () => {
  window.addEventListener('keyup', event => {
    const func = EVENTS.get(eventKey(event));
    if (func) {
      event.preventDefault();
      func();
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
