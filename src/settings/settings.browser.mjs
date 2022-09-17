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
const {
  APP_EVENTS, ELECTRONIM_VERSION, html, ipcRenderer, preact: {render}, preactHooks: {useReducer}, TopBar
} = window;
import {
  ACTIONS, reducer, dictionariesEnabled, setTabProperty, toggleTabProperty
} from './settings.reducer.browser.mjs';
import {
  Checkbox
} from './settings.common.browser.mjs';
import {
  SpellCheckContainer
} from './settings.spell-check.browser.mjs';

const settingsRoot = () => document.querySelector('.settings');

const newTabClass = state => {
  if (state.newTabValue.length === 0) {
    return '';
  }
  return state.newTabValid ? 'is-success' : 'is-danger';
};

const SettingsButton = ({icon, disabled = false, title, onclick}) => (html`
  <button class='settings__button button' disabled=${disabled} onclick=${onclick}>
    <span class='icon is-medium' title='${title}'>
      <i class='fas ${icon}'></i>
    </span>
  </button>
`);

const ExpandButton = ({dispatch, id, expanded = false}) => {
  const properties = {
    icon: expanded ? 'fa-chevron-down' : 'fa-chevron-right',
    title: expanded ? 'Collapse' : 'Expand (show advanced settings)',
    onclick: () => dispatch({type: ACTIONS.TOGGLE_TAB_EXPANDED, payload: id})
  };
  return html`
    <${SettingsButton} ...${properties} />
  `;
};

const disabledIcon = disabled => (disabled === true ? 'fa-eye-slash' : 'fa-eye');
const sandboxedIcon = sandboxed => (sandboxed === true ? 'fa-lock' : 'fa-lock-open');

const TabAdvancedSettings = (
  {dispatch, id, sandboxed = false}
) => (html`
  <div class="settings__tab-advanced container">
    <${Checkbox} label="Sandbox" checked=${sandboxed} value=${id}
      title='Use an isolated/sandboxed session for this tab'
      icon=${sandboxedIcon(sandboxed)}
      onclick=${toggleTabProperty(dispatch, 'sandboxed', id)}
    />
  </div>
`);

const TabEntry = ({
  dispatch, invalidTabs, id, expanded, url, disabled, disableNotifications = false, ...tab
}) => (html`
  <div class='settings__tab ${expanded && 'settings__tab--expanded'} panel-block' data-id=${id}>
    <div class='settings__tab-main'>
      <${ExpandButton} dispatch=${dispatch} id=${id} expanded=${expanded} />
      <div class='control'>
        <input type='text' class=${`input ${invalidTabs.has(id) ? 'is-danger' : ''}`} name='tabs'
          oninput=${({target: {value}}) => setTabProperty({dispatch, property: 'url', value, id})}
          value=${url} />
      </div>
      <${SettingsButton} icon=${disabledIcon(disabled)}
        title=${disabled ? 'Tab disabled. Click to enable' : 'Tab enabled. Click to disable'}
        onclick=${toggleTabProperty(dispatch, 'disabled', id)}
      />
      <${SettingsButton} icon=${disableNotifications ? 'fa-bell-slash' : 'fa-bell'}
        title=${disableNotifications ? 'Notifications disabled. Click to enable' : 'Notifications enabled. Click to disable'}
        onclick=${toggleTabProperty(dispatch, 'disableNotifications', id)}
      />
      <${SettingsButton} icon='fa-trash' title='Delete tab'
        onclick=${() => dispatch({type: ACTIONS.REMOVE, payload: {id}})}
      /> 
    </div>
    <${TabAdvancedSettings} dispatch=${dispatch} id=${id} expanded=${expanded} disabled=${disabled}
      ...${tab}
    />
  </div>
`);


const Settings = ({initialState}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const enabledDictionaries = dictionariesEnabled(state);
  const onNewTabInput = ({target: {value}}) => dispatch({
    type: ACTIONS.UPDATE_NEW_TAB_VALUE,
    payload: value
  });
  const addTab = () => dispatch({type: ACTIONS.ADD});
  const onNewKeyDown = ({code}) => {
    if (code === 'Enter') {
      addTab();
    }
  };
  const toggleNotifications = () => dispatch({type: ACTIONS.TOGGLE_GLOBAL_NOTIFICATIONS});
  const save = () => ipcRenderer.send(APP_EVENTS.settingsSave, {
    tabs: state.tabs,
    useNativeSpellChecker: state.useNativeSpellChecker,
    enabledDictionaries,
    disableNotificationsGlobally: state.disableNotificationsGlobally
  });
  const cancel = () => ipcRenderer.send(APP_EVENTS.closeDialog);
  return html`
  <${TopBar} fixed=${true} title='Settings'
    endComponents=${html`
      <div class="navbar-item field is-grouped">
        <div class="control">
          <button class="settings__submit button is-link"
            disabled=${!state.canSave || state.invalidTabs.size !== 0} onclick=${save}>Ok</button>
        </div>
        <div class="control">
          <button class="settings__cancel button is-link is-light" onclick=${cancel}>Cancel</button>
        </div>
      </div>
    `}
  />
  <div class="container">
    <div class="form">
      <nav class="panel">
        <p class="panel-heading">Tabs</p>
        <div class="settings__new-tab panel-block">
          <div class="control">
            <input type="text"
              class="input ${newTabClass(state)}"
              placeholder="https://web.whatsapp.com"
              value=${state.newTabValue}
              oninput=${onNewTabInput}
              onkeydown=${onNewKeyDown}
            />
          </div>
          <${SettingsButton} icon='fa-plus' onclick=${addTab} disabled=${!state.newTabValid} />
        </div>
        <div class="settings__tabs container field">
          ${state.tabs.map(tab => (html`
            <${TabEntry}
              dispatch=${dispatch} expanded=${state.expandedTabs.includes(tab.id)} invalidTabs=${state.invalidTabs}
              ...${tab}
            />
        `))}
        </div>
      </nav>
      <${SpellCheckContainer} dispatch=${dispatch} state=${state} />
      <nav class="panel">
        <p class="panel-heading">Other</p>
        <div class="panel-block">
          <div class="settings__global-notifications container">
            <${Checkbox}
              label="Disable notifications globally"
              icon=${state.disableNotificationsGlobally ? 'fa-bell-slash' : 'fa-bell'}
              checked=${state.disableNotificationsGlobally}
              value=${state.disableNotificationsGlobally}
              onclick=${toggleNotifications}
            />
          </div>
        </div>
        <div class="panel-block is-italic">
          ElectronIM version ${ELECTRONIM_VERSION}
        </div>
      </nav>
    </div>
  </div>
`;
};

Promise.all([
  ipcRenderer.invoke(APP_EVENTS.settingsLoad),
  ipcRenderer.invoke(APP_EVENTS.dictionaryGetAvailable),
  ipcRenderer.invoke(APP_EVENTS.dictionaryGetAvailableNative),
  ipcRenderer.invoke(APP_EVENTS.dictionaryGetEnabled)
]).then(
  (
    [currentSettings, availableDictionaries, availableNativeDictionaries, enabledDictionaries]
  ) => {
    const initialState = {
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
      invalidTabs: new Set(),
      canSave: currentSettings.tabs.length > 0,
      disableNotificationsGlobally: currentSettings.disableNotificationsGlobally
    };
    render(html`<${Settings} initialState=${initialState} />`, settingsRoot());
  }
);
