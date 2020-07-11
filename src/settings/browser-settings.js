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
const {h, render} = window.preact;
const {useReducer} = window.preactHooks;
const html = window.htm.bind(h);
const settings = () => document.querySelector('.settings');

const prependProtocol = url => {
  if (url && !url.match(/^https?:\/\/.+/)) {
    return `https://${url}`;
  }
  return url;
};

const validateUrl = url => {
  url = prependProtocol(url);
  if (!url && !url.match(/^https?:\/\/.+/)) {
    return false;
  }
  try {
    return new URL(url);
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
  newTabValid: false,
  newTabValue: '',
  canSave: window.tabs.length > 0
};

const ACTIONS = {
  ADD: 'ADD',
  REMOVE: 'REMOVE',
  TOGGLE_DICTIONARY: 'TOGGLE_DICTIONARY',
  TOGGLE_TAB_SANDBOX: 'TOGGLE_TAB_SANDBOX',
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
          sandboxed: false,
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
    case ACTIONS.TOGGLE_TAB_SANDBOX: {
      const newState = {...state, tabs: []};
      state.tabs.forEach(tab => {
        const newTab = {...tab};
        if (newTab.id === action.payload.id) {
          newTab.sandboxed = !newTab.sandboxed;
        }
        newState.tabs.push(newTab);
      });
      return newState;
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

const SettingsButton = ({icon, disabled = false, title, onclick}) => (html`
  <button class='settings__button button' disabled=${disabled} onclick=${onclick}>
    <span class='icon is-medium' title='${title}'>
      <i class='fas ${icon}'></i>
    </span>
  </button>
`);
const TabEntry = ({dispatch, id, url, sandboxed}) => (html`
  <div class='settings__tab field '>
    <div class='control'>
      <input type='text' readonly class='input' name='tabs' value='${url}' />
    </div>
    <${SettingsButton} icon=${sandboxed ? 'fa-lock' : 'fa-lock-open'}
      title='Use isolated session when lock is on'
      onclick=${() => dispatch({type: ACTIONS.TOGGLE_TAB_SANDBOX, payload: {id}})}
    />
    <${SettingsButton} icon='fa-trash' title='Delete tab'
      onclick=${() => dispatch({type: ACTIONS.REMOVE, payload: {id}})}
    />
  </div>
`);

const DictionaryEntry = ({dispatch, dictionaryKey, name, enabled = false}) => (html`
  <div class='control'>
    <label class='checkbox'>
        <input type='checkbox' name='dictionaries'
          value='${dictionaryKey}' checked=${enabled}
          onclick=${() => dispatch({type: ACTIONS.TOGGLE_DICTIONARY, payload: dictionaryKey})}
        />
        ${name} (${dictionaryKey})
    </label>
  </div>
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
  const save = () => ipcRenderer.send(APP_EVENTS.settingsSave, {
    tabs: state.tabs,
    enabledDictionaries
  });
  const cancel = () => ipcRenderer.send(APP_EVENTS.settingsCancel);
  return html`
  <h1 class="title">Settings</h1>
  <div class="container">
    <div class="form">
      <label class="label">Tabs</label>
      <div class="settings__new-tab container field">
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
          <${TabEntry} dispatch=${dispatch} ...${tab} />
      `))}
      </div>
      <div class="field">
        <label class="label">Spell checker languages</label>
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
      <div class="field is-grouped">
        <div class="control">
          <button class="settings__submit button is-link"
            disabled=${!state.canSave} onclick=${save}>Ok</button>
      </div>
        <div class="control">
          <button class="settings__cancel button is-link is-light" onclick=${cancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
`;
};

render(html`<${Settings} />`, settings());
