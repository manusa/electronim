/*
   Copyright 2025 Marc Nuri San Felix

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
import {html, Card, Icon, Select} from '../components/index.mjs';
import {
  isPaneActive,
  setProperty,
  keyboardShortcuts
} from './settings.reducer.browser.mjs';
import {SettingsRow} from './settings.common.browser.mjs';

export const KeyboardPane = ({dispatch, state}) => {
  const shortcuts = keyboardShortcuts(state);
  const dispatchSetProperty = setProperty({dispatch});

  const setTabSwitchModifier = e => {
    dispatchSetProperty({
      property: 'keyboardShortcuts',
      value: {
        ...shortcuts,
        tabSwitchModifier: e.target.value || ''
      }
    });
  };

  const setTabTraverseModifier = e => {
    dispatchSetProperty({
      property: 'keyboardShortcuts',
      value: {
        ...shortcuts,
        tabTraverseModifier: e.target.value || ''
      }
    });
  };

  return isPaneActive(state)(KeyboardPane.id) && html`
    <h2 class='title'><${Icon}>${Icon.keyboard}</${Icon}>Keyboard Shortcuts</h2>
    <${Card} className='settings__keyboard'>
      <p class='title-small' data-testid='settings-keyboard-tab-switch-modifier-title'>Tab Switch</p>
      <${SettingsRow} data-testid='settings-keyboard-tab-switch-modifier'>
        <${Select}
          label='Tab Switch Modifier'
          value=${shortcuts?.tabSwitchModifier || ''}
          onChange=${setTabSwitchModifier}
        >
          <${Select.Option} value=''>Ctrl (default)</${Select.Option}>
          <${Select.Option} value='Alt'>Alt</${Select.Option}>
          <${Select.Option} value='Command'>Command</${Select.Option}>
          <${Select.Option} value='Control'>Control</${Select.Option}>
          <${Select.Option} value='Ctrl'>Ctrl</${Select.Option}>
          <${Select.Option} value='Meta'>Meta</${Select.Option}>
        </${Select}>
        <div data-testid='settings-keyboard-tab-switch-modifier-description'>
          ${shortcuts?.tabSwitchModifier || 'Ctrl'}+1-9 to switch to specific tab
        </div>
      </${SettingsRow}>
      <${Card.Divider} />
      <p class='title-small' data-testid='settings-keyboard-tab-traverse-modifier-title'>Tab Traverse</p>
      <${SettingsRow} data-testid='settings-keyboard-tab-traverse-modifier'>
        <${Select}
          label='Tab Traverse Modifier'
          value=${shortcuts?.tabTraverseModifier || ''}
          onChange=${setTabTraverseModifier}
        >
          <${Select.Option} value=''>Ctrl (default)</${Select.Option}>
          <${Select.Option} value='Alt'>Alt</${Select.Option}>
          <${Select.Option} value='Command'>Command</${Select.Option}>
          <${Select.Option} value='Control'>Control</${Select.Option}>
          <${Select.Option} value='Ctrl'>Ctrl</${Select.Option}>
          <${Select.Option} value='Meta'>Meta</${Select.Option}>
        </${Select}>
        <div data-testid='settings-keyboard-tab-traverse-modifier-description'>
          ${shortcuts?.tabTraverseModifier || 'Ctrl'}+Tab to cycle through tabs
        </div>
      </${SettingsRow}>
    </${Card}>
  `;
};

KeyboardPane.id = 'keyboard';
