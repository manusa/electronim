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
const {html, preact: {render}, preactHooks: {useReducer}, TopBar} = window;

const settings = () => document.querySelector('.settings');

const prependProtocol = url => {
  if (url && !url.match(/^https?:\/\/.+/)) {
    return `https://${url}`;
  }
  return url;
};

const validateUrl = (url, allowNoProtocol = true) => {
  if (allowNoProtocol) {
    url = prependProtocol(url);
  }
  if (!url && !url.match(/^https?:\/\/.+/)) {
    return false;
  }
  try {
    // eslint-disable-next-line no-unused-vars
    const ignored = new URL(url);
    return true;
  } catch (error) {
    /* error is ignored */
  }
  return false;
};

const newTabClass = state => {
  if (state.newTabValue.length === 0) {
    return '';
  }
  return state.newTabValid ? 'is-success' : 'is-danger';
};

const newId = () => (
  new Date().getTime().toString(36) + Math.random().toString(36).slice(2) // NOSONAR
);

const initialState = {
  dictionaries: window.dictionaries,
  tabs: window.tabs,
  expandedTabs: [],
  newTabValid: false,
  newTabValue: '',
  invalidTabs: new Set(),
  canSave: window.tabs.length > 0,
  disableNotificationsGlobally: window.disableNotificationsGlobally
};

const ACTIONS = {
  ADD: 'ADD',
  REMOVE: 'REMOVE',
  SET_TAB_PROPERTY: 'SET_TAB_PROPERTY',
  TOGGLE_DICTIONARY: 'TOGGLE_DICTIONARY',
  TOGGLE_TAB_EXPANDED: 'TOGGLE_TAB_EXPANDED',
  TOGGLE_TAB_PROPERTY: 'TOGGLE_TAB_PROPERTY',
  TOGGLE_GLOBAL_NOTIFICATIONS: 'TOGGLE_GLOBAL_NOTIFICATIONS',
  UPDATE_NEW_TAB_VALUE: 'UPDATE_NEW_TAB_VALUE'
};

const dictionariesEnabled = state => state.dictionaries.enabled;
const dictionariesAvailable = state => state.dictionaries.available;

const reducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.ADD: {
      if (!validateUrl(state.newTabValue)) {
        return {...state};
      }
      return {...state,
        newTabValid: false,
        newTabValue: '',
        tabs: [...state.tabs, {
          id: newId(),
          disabled: false,
          sandboxed: false,
          disableNotifications: false,
          url: prependProtocol(state.newTabValue)
        }],
        canSave: true
      };
    }
    case ACTIONS.REMOVE: {
      return {...state,
        tabs: state.tabs.filter(tab => tab.id !== action.payload.id),
        canSave: state.tabs.filter(tab => tab.id !== action.payload.id).length > 0
      };
    }
    case ACTIONS.SET_TAB_PROPERTY: {
      const newState = {...state, tabs: []};
      state.tabs.forEach(tab => {
        const newTab = {...tab};
        if (newTab.id === action.payload.id) {
          newTab[action.payload.property] = action.payload.value;
          if (!validateUrl(newTab.url, false)) {
            newState.invalidTabs.add(newTab.id);
          } else {
            newState.invalidTabs.delete(newTab.id);
          }
        }
        newState.tabs.push(newTab);
      });
      return newState;
    }
    case ACTIONS.TOGGLE_DICTIONARY: {
      const newState = {...state};
      if (dictionariesEnabled(newState).includes(action.payload)) {
        newState.dictionaries.enabled = [...dictionariesEnabled(newState)
          .filter(key => key !== action.payload)];
      } else {
        newState.dictionaries.enabled = [...dictionariesEnabled(newState), action.payload];
      }
      return newState;
    }
    case ACTIONS.TOGGLE_TAB_EXPANDED: {
      if (state.expandedTabs.includes(action.payload)) {
        return {...state,
          expandedTabs: state.expandedTabs.filter(id => id !== action.payload)};
      }
      return {...state,
        expandedTabs: [...state.expandedTabs, action.payload]
      };
    }
    case ACTIONS.TOGGLE_TAB_PROPERTY: {
      const newState = {...state, tabs: []};
      state.tabs.forEach(tab => {
        const newTab = {...tab};
        if (newTab.id === action.payload.id) {
          newTab[action.payload.property] = !newTab[action.payload.property];
        }
        newState.tabs.push(newTab);
      });
      return newState;
    }
    case ACTIONS.TOGGLE_GLOBAL_NOTIFICATIONS: {
      return {...state,
        disableNotificationsGlobally: !state.disableNotificationsGlobally
      };
    }
    case ACTIONS.UPDATE_NEW_TAB_VALUE: {
      return {...state,
        newTabValid: validateUrl(action.payload),
        newTabValue: action.payload,
        canSave: action.payload.length === 0 && state.tabs.length > 0
      };
    }
    default: return {...state};
  }
};

const setTabProperty = ({dispatch, property, value, id}) =>
  dispatch({type: ACTIONS.SET_TAB_PROPERTY, payload: {id, property, value}});
const toggleTabProperty = (dispatch, property, id) =>
  () => dispatch({type: ACTIONS.TOGGLE_TAB_PROPERTY, payload: {id, property}});

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

const Checkbox = ({label, title = '', icon, checked, value, onclick}) => (html`
  <div class='control'>
    <label class='checkbox' title=${title}>
      <input type='checkbox' checked=${checked} title=${title} value=${value} onclick=${onclick} />
      ${icon && html`<i class='checkbox__icon fas ${icon}'></i>`} ${label} 
    </label>
  </div>
`);

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

const DictionaryEntry = ({dispatch, dictionaryKey, name, enabled = false}) => (html`
  <${Checkbox} label=${`${name} (${dictionaryKey})`} checked=${enabled}
    value=${dictionaryKey}
    onclick=${() => dispatch({type: ACTIONS.TOGGLE_DICTIONARY, payload: dictionaryKey})}
  />
`);

const Settings = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const enabledDictionaries = dictionariesEnabled(state);
  const availableDictionaries = dictionariesAvailable(state);
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
      <nav class="panel">
        <p class="panel-heading">Spell checker languages</p>
        <div class="panel-block">
          <div class="settings__dictionaries container">${
  Object.entries(availableDictionaries)
    .sort(([, {name: name1}], [, {name: name2}]) => name1.localeCompare(name2))
    .map(([key, {name}]) => (html`
      <${DictionaryEntry} dispatch=${dispatch} dictionaryKey=${key} name=${name}
        enabled=${enabledDictionaries.includes(key)}
      />
    `))}
          </div>
        </div>
      </nav>
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

render(html`<${Settings} />`, settings());
