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
const {loadSettings} = require('../settings');

const eventKey = ({key, shift = false, control = false, alt = false, meta = false}) =>
  `${key}-${shift}-${control}-${alt}-${meta}`;

const eventAction = (func, {preventDefault = true} = {}) => {
  return event => {
    func(event);
    if (preventDefault) {
      event.preventDefault();
    }
  };
};

const getModifierForKey = modifierName => {
  if (!modifierName || modifierName.trim() === '') {
    return {control: true}; // Default to ctrl
  }

  const modifier = modifierName.toLowerCase().trim();
  switch (modifier) {
    case 'alt':
      return {alt: true};
    case 'ctrl':
    case 'control':
      return {control: true};
    case 'meta':
    case 'command':
      return {meta: true};
    default:
      return {control: true}; // Default fallback
  }
};

const createKeyboardShortcutsEvents = settings => {
  const events = new Map();
  const keyboardShortcuts = settings.keyboardShortcuts || {
    tabSwitchModifier: '',
    tabTraverseModifier: ''
  };

  // Fixed shortcuts (not customizable)
  events.set(eventKey({key: 'Escape'}),
    eventAction(() => eventBus.emit(APP_EVENTS.escape), {preventDefault: false}));

  events.set(eventKey({key: 'F11'}), eventAction(() => eventBus.emit(APP_EVENTS.fullscreenToggle)));

  // Customizable tab switching shortcuts
  const tabSwitchModifier = getModifierForKey(keyboardShortcuts.tabSwitchModifier);
  Array(9).fill(1).forEach((min, idx) => {
    const key = min + idx;
    const func = () => eventBus.emit(APP_EVENTS.tabSwitchToPosition, key);
    events.set(eventKey({key, ...tabSwitchModifier}), eventAction(func));

    // Always keep Meta (Command) for Mac compatibility
    if (!tabSwitchModifier.meta) {
      events.set(eventKey({key, meta: true}), eventAction(func));
    }
  });

  // Customizable tab traversal shortcuts
  const tabTraverseModifier = getModifierForKey(keyboardShortcuts.tabTraverseModifier);
  events.set(eventKey({key: 'Tab', ...tabTraverseModifier}), eventAction(() =>
    eventBus.emit(APP_EVENTS.tabTraverseNext)));

  events.set(eventKey({key: 'Tab', shift: true, ...tabTraverseModifier}), eventAction(() =>
    eventBus.emit(APP_EVENTS.tabTraversePrevious)));

  // Find in page shortcuts (not customizable)
  const findInPageOpen = eventAction(() => eventBus.emit(APP_EVENTS.findInPageOpen));
  events.set(eventKey({key: 'f', meta: true}), findInPageOpen);
  events.set(eventKey({key: 'F', meta: true}), findInPageOpen);
  events.set(eventKey({key: 'f', control: true}), findInPageOpen);
  events.set(eventKey({key: 'F', control: true}), findInPageOpen);

  return events;
};

const registerAppShortcuts = (_, webContents) => {
  let events = createKeyboardShortcutsEvents(loadSettings());

  // Reload shortcuts when settings change
  eventBus.on(APP_EVENTS.settingsSave, () => {
    events = createKeyboardShortcutsEvents(loadSettings());
  });

  webContents.on('before-input-event', (event, {type, key, shift, control, alt, meta}) => {
    if (type === 'keyUp') {
      return;
    }
    const func = events.get(eventKey({key, shift, control, alt, meta}));
    if (func) {
      func(event);
    }
  });
};

module.exports = {registerAppShortcuts};
