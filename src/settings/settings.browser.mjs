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
const {
  closeDialog, dictionaryGetAvailable, dictionaryGetAvailableNative, dictionaryGetEnabled,
  settingsLoad, settingsSave
} = globalThis.electron;

import {
  html, render, useReducer, Icon, IconButton, NavigationRail, TopAppBar
} from '../components/index.mjs';
import {
  reducer, activatePane, canCancel, canSave, dictionariesEnabled, isPaneActive
} from './settings.reducer.browser.mjs';
import {
  OtherPane
} from './settings.other.browser.mjs';
import {
  ServicesPane
} from './settings.services.browser.mjs';
import {
  SpellCheckPane
} from './settings.spell-check.browser.mjs';
import {
  KeyboardPane
} from './settings.keyboard.browser.mjs';
import {
  AppearancePane
} from './settings.appearance.browser.mjs';

const settingsRoot = () => document.querySelector('.settings');

const Settings = ({initialState}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const enabledDictionaries = dictionariesEnabled(state);
  const onActivatePane = activatePane({dispatch});
  const save = () => settingsSave({
    tabs: state.tabs,
    useNativeSpellChecker: state.useNativeSpellChecker,
    enabledDictionaries,
    disableNotificationsGlobally: state.disableNotificationsGlobally,
    theme: state.theme,
    trayEnabled: state.trayEnabled,
    startMinimized: state.startMinimized,
    alwaysOnTop: state.alwaysOnTop,
    closeButtonBehavior: state.closeButtonBehavior,
    keyboardShortcuts: state.keyboardShortcuts
  });
  const cancel = () => closeDialog();
  return html`
    <${TopAppBar} headline='Settings' icon=${Icon.arrowBack} iconClick=${cancel} iconDisabled=${!canCancel(state)}
      trailingIcon=${html`<${IconButton}
          className='settings__submit' icon=${Icon.save} onClick=${save}
          disabled=${!canSave(state) || state.invalidTabs.size !== 0}/>`}
    />
    <${NavigationRail}>
      <${NavigationRail.Button} label='Services' icon=${Icon.apps}
        active=${isPaneActive(state)(ServicesPane.id)} onClick=${() => onActivatePane(ServicesPane.id)} />
      <${NavigationRail.Button} label='Spell check' icon=${Icon.spellcheck}
        active=${isPaneActive(state)(SpellCheckPane.id)} onClick=${() => onActivatePane(SpellCheckPane.id)} />
      <${NavigationRail.Button} label='Keyboard' icon=${Icon.keyboard}
        active=${isPaneActive(state)(KeyboardPane.id)} onClick=${() => onActivatePane(KeyboardPane.id)} />
      <${NavigationRail.Button} label='Appearance' icon=${Icon.palette}
        active=${isPaneActive(state)(AppearancePane.id)} onClick=${() => onActivatePane(AppearancePane.id)} />
      <${NavigationRail.Button} label='Other' icon=${Icon.more}
        active=${isPaneActive(state)(OtherPane.id)} onClick=${() => onActivatePane(OtherPane.id)} />
    </${NavigationRail}>
    <div>
      <${ServicesPane} dispatch=${dispatch} state=${state} />
      <${SpellCheckPane} dispatch=${dispatch} state=${state} />
      <${KeyboardPane} dispatch=${dispatch} state=${state} />
      <${AppearancePane} dispatch=${dispatch} state=${state} />
      <${OtherPane} dispatch=${dispatch} state=${state} />
    </div>
  `;
};

Promise.all([
  settingsLoad(),
  dictionaryGetAvailable(),
  dictionaryGetAvailableNative(),
  dictionaryGetEnabled()
]).then(
  (
    [currentSettings, availableDictionaries, availableNativeDictionaries, enabledDictionaries]
  ) => {
    const initialState = {
      activePane: ServicesPane.id,
      invalidTabs: new Set(),
      canCancel: currentSettings.tabs.length > 0,
      canSave: currentSettings.tabs.length > 0,
      dictionaries: {
        available: availableDictionaries,
        availableNative: availableNativeDictionaries,
        enabled: enabledDictionaries
      },
      useNativeSpellChecker: currentSettings.useNativeSpellChecker,
      tabs: currentSettings.tabs,
      expandedTabs: [],
      newTabValid: false,
      newTabValue: '',
      disableNotificationsGlobally: currentSettings.disableNotificationsGlobally,
      theme: currentSettings.theme,
      trayEnabled: currentSettings.trayEnabled,
      startMinimized: currentSettings.startMinimized,
      alwaysOnTop: currentSettings.alwaysOnTop,
      closeButtonBehavior: currentSettings.closeButtonBehavior,
      keyboardShortcuts: currentSettings.keyboardShortcuts
    };
    render(html`<${Settings} initialState=${initialState} />`, settingsRoot());
  }
);
