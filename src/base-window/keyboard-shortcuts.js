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
const {APP_EVENTS, KEYBOARD_SHORTCUTS} = require('../constants');

const eventKey = ({key, shift = false, control = false, alt = false, meta = false}) =>
  `${key}-${shift}-${control}-${alt}-${meta}`;

const eventKeyForModifier = ({key, shift = false, modifier}) => {
  switch (modifier.toLowerCase().trim()) {
    case 'control':
    case 'ctrl':
      return eventKey({key, shift, control: true});
    case 'alt':
      return eventKey({key, shift, alt: true});
    case 'meta':
    case 'cmd':
    case 'command':
      return eventKey({key, shift, meta: true});
    default:
      throw new Error(`Unknown modifier: ${modifier}`);
  }
};

const eventAction = (func, {preventDefault = true} = {}) => {
  return event => {
    func(event);
    if (preventDefault) {
      event.preventDefault();
    }
  };
};

const EVENTS = new Map();

const setKeyboardShortcutsListeners = settings => {
  EVENTS.clear();

  EVENTS.set(eventKey({key: 'Escape'}),
    eventAction(() => eventBus.emit(APP_EVENTS.escape), {preventDefault: false}));

  EVENTS.set(eventKey({key: 'F11'}), eventAction(() => eventBus.emit(APP_EVENTS.fullscreenToggle)));

  const tabSwitchModifier = settings?.keyboardShortcuts?.tabSwitchModifier || KEYBOARD_SHORTCUTS.tabSwitchModifier;
  Array(9).fill(1).forEach((min, idx) => {
    const key = min + idx;
    const func = () => eventBus.emit(APP_EVENTS.tabSwitchToPosition, key);
    EVENTS.set(eventKeyForModifier({key, modifier: tabSwitchModifier}), eventAction(func));
    // eslint-disable-next-line no-warning-comments
    // TODO: For legacy reasons cmd+1-9 needs to be supported when key is not set in macOS
    EVENTS.set(eventKey({key, meta: true}), eventAction(func));
  });

  const tabTraverseModifier = settings?.keyboardShortcuts?.tabTraverseModifier ||
    KEYBOARD_SHORTCUTS.tabTraverseModifier;
  EVENTS.set(eventKeyForModifier({key: 'Tab', modifier: tabTraverseModifier}), eventAction(() =>
    eventBus.emit(APP_EVENTS.tabTraverseNext)));

  EVENTS.set(eventKeyForModifier({key: 'Tab', shift: true, modifier: tabTraverseModifier}), eventAction(() =>
    eventBus.emit(APP_EVENTS.tabTraversePrevious)));

  const findInPageOpen = eventAction(() => eventBus.emit(APP_EVENTS.findInPageOpen));
  EVENTS.set(eventKey({key: 'f', meta: true}), findInPageOpen);
  EVENTS.set(eventKey({key: 'F', meta: true}), findInPageOpen);
  EVENTS.set(eventKey({key: 'f', control: true}), findInPageOpen);
  EVENTS.set(eventKey({key: 'F', control: true}), findInPageOpen);
};

/**
 * Initializes keyboard shortcuts EVENTS map from loaded settings.
 *
 * Should be run every time settings are changed and loaded.
 */
const initKeyboardEvents = () => {
  const settings = require('../settings').loadSettings();
  setKeyboardShortcutsListeners(settings);
};

/**
 * Registers application-wide keyboard shortcuts.
 *
 * Designed to be used as a listener of the `web-contents-created` event of
 * Electron's `app` module.
 *
 * @param {Event} _ The web-contents-created event (not used).
 * @param {WebContents} webContents The WebContents where to register the shortcuts.
 */
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

// Always initialize the EVENTS map constant:
setKeyboardShortcutsListeners();
module.exports = {registerAppShortcuts, initKeyboardEvents};
