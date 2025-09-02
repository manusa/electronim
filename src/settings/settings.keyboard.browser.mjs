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
import {html, Card, TextField} from '../components/index.mjs';
import {
  isPaneActive,
  setProperty,
  keyboardShortcuts
} from './settings.reducer.browser.mjs';
import {SettingsRow} from './settings.common.browser.mjs';

const validateKeyboardShortcut = value => {
  if (!value || value.trim() === '') {
    return true; // Empty is valid (uses default)
  }

  // Basic validation: should be in format like "Alt", "Ctrl", "Meta"
  const validModifiers = ['Alt', 'Ctrl', 'Meta', 'Control', 'Command'];
  const trimmedValue = value.trim();

  return validModifiers.some(modifier =>
    trimmedValue.toLowerCase() === modifier.toLowerCase()
  );
};

export const KeyboardPane = ({dispatch, state}) => {
  const shortcuts = keyboardShortcuts(state);
  const dispatchSetProperty = setProperty({dispatch});

  const setTabSwitchModifier = e => {
    const value = e.target.value;
    dispatchSetProperty({
      property: 'keyboardShortcuts',
      value: {
        ...shortcuts,
        tabSwitchModifier: value
      }
    });
  };

  const setTabTraverseModifier = e => {
    const value = e.target.value;
    dispatchSetProperty({
      property: 'keyboardShortcuts',
      value: {
        ...shortcuts,
        tabTraverseModifier: value
      }
    });
  };

  return isPaneActive(state)(KeyboardPane.id) && html`
    <h2 class='title'>Keyboard Shortcuts</h2>
    <${Card} className='settings__keyboard'>
      <${SettingsRow}>
        <${TextField}
          label='Tab Switch Modifier'
          placeholder='Ctrl (default)'
          value=${shortcuts.tabSwitchModifier || ''}
          onInput=${setTabSwitchModifier}
          hasError=${shortcuts.tabSwitchModifier && !validateKeyboardShortcut(shortcuts.tabSwitchModifier)}
          helperText='Modifier key for tab selection (Ctrl+1, Alt+1, etc.). Leave empty for default.'
        />
      </${SettingsRow}>
      <${Card.Divider} />
      <${SettingsRow}>
        <${TextField}
          label='Tab Traverse Modifier'
          placeholder='Ctrl (default)'
          value=${shortcuts.tabTraverseModifier || ''}
          onInput=${setTabTraverseModifier}
          hasError=${shortcuts.tabTraverseModifier && !validateKeyboardShortcut(shortcuts.tabTraverseModifier)}
          helperText='Modifier key for tab traversal (Ctrl+Tab). Leave empty for default.'
        />
      </${SettingsRow}>
      <div class='settings__keyboard-help'>
        <p><strong>Tab Switch:</strong> ${shortcuts.tabSwitchModifier || 'Ctrl'}+1-9 to switch to specific tab</p>
        <p><strong>Tab Traverse:</strong> ${shortcuts.tabTraverseModifier || 'Ctrl'}+Tab to cycle through tabs</p>
        <p><strong>Valid modifiers:</strong> Alt, Ctrl, Meta, Control, Command</p>
      </div>
    </${Card}>
  `;
};

KeyboardPane.id = 'keyboard';
