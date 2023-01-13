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
const {ipcMain: eventBus} = require('electron');
const {APP_EVENTS} = require('../constants');

const eventKey = ({key, shift = false, control = false, alt = false, meta = false}) =>
  `${key}-${shift}-${control}-${alt}-${meta}`;

// eslint-disable-next-line arrow-body-style
const eventAction = (func, {preventDefault = true} = {}) => {
  return event => {
    func(event);
    if (preventDefault) {
      event.preventDefault();
    }
  };
};

const EVENTS = new Map();

EVENTS.set(eventKey({key: 'Escape'}), eventAction(() => {
  eventBus.emit(APP_EVENTS.appMenuClose);
  eventBus.emit(APP_EVENTS.closeDialog);
}, {preventDefault: false}));

EVENTS.set(eventKey({key: 'F11'}), eventAction(() => eventBus.emit(APP_EVENTS.fullscreenToggle)));

Array(9).fill(1).forEach((min, idx) => {
  const key = min + idx;
  const func = () => eventBus.emit(APP_EVENTS.tabSwitchToPosition, key);
  EVENTS.set(eventKey({key, control: true}), eventAction(func));
  EVENTS.set(eventKey({key, meta: true}), eventAction(func));
});

EVENTS.set(eventKey({key: 'Tab', control: true}), eventAction(() =>
  eventBus.emit(APP_EVENTS.tabTraverseNext)));

EVENTS.set(eventKey({key: 'Tab', shift: true, control: true}), eventAction(() =>
  eventBus.emit(APP_EVENTS.tabTraversePrevious)));

const registerAppShortcuts = (_, webContents) => {
  webContents.on('before-input-event', (event, {type, key, shift, control, alt, meta}) => {
    if (type === 'keyUp') {
      return;
    }
    const func = EVENTS.get(eventKey({key, shift, control, alt, meta}));
    if (func) {
      func(event);
    }
  });
};

module.exports = {registerAppShortcuts};
