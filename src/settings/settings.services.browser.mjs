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
import {Card, Checkbox, html} from '../components/index.mjs';
import {ACTIONS, addTab, isPaneActive, setTabProperty, toggleTabProperty} from './settings.reducer.browser.mjs';

const disabledIcon = disabled => (disabled === true ? 'fa-eye-slash' : 'fa-eye');
const sandboxedIcon = sandboxed => (sandboxed === true ? 'fa-lock' : 'fa-lock-open');
const newTabClass = state => {
  if (state.newTabValue.length === 0) {
    return '';
  }
  return state.newTabValid ? 'is-success' : 'is-danger';
};

const SettingsButton = ({icon, disabled = false, title, onClick}) => (html`
  <button class='settings__button button' disabled=${disabled} onClick=${onClick}>
    <span class='icon is-medium' title='${title}'>
      <i class='fas ${icon}'></i>
    </span>
  </button>
`);

const ExpandButton = ({dispatch, id, expanded = false}) => {
  const properties = {
    icon: expanded ? 'fa-chevron-down' : 'fa-chevron-right',
    title: expanded ? 'Collapse' : 'Expand (show advanced settings)',
    onClick: () => dispatch({type: ACTIONS.TOGGLE_TAB_EXPANDED, payload: id})
  };
  return html`
    <${SettingsButton} ...${properties} />
  `;
};

const TabAdvancedSettings = (
  {dispatch, id, sandboxed = false}
) => (html`
  <div class="settings__tab-advanced container">
    <${Checkbox} label="Sandbox" checked=${sandboxed} value=${id}
      title='Use an isolated/sandboxed session for this tab'
      icon=${sandboxedIcon(sandboxed)}
      onClick=${toggleTabProperty(dispatch, 'sandboxed', id)}
    />
  </div>
`);

const TabEntry = ({
  dispatch, invalidTabs, id, expanded, url, disabled, disableNotifications = false, ...tab
}) => (html`
  <${Card.Divider} />
  <div class='settings__tab ${expanded && 'settings__tab--expanded'}' data-id=${id}>
    <div class='settings__tab-main'>
      <${ExpandButton} dispatch=${dispatch} id=${id} expanded=${expanded} />
      <div class='control'>
        <input type='text' class=${`input ${invalidTabs.has(id) ? 'is-danger' : ''}`} name='tabs'
          oninput=${({target: {value}}) => setTabProperty({dispatch, property: 'url', value, id})}
          value=${url} />
      </div>
      <${SettingsButton} icon=${disabledIcon(disabled)}
        title=${disabled ? 'Tab disabled. Click to enable' : 'Tab enabled. Click to disable'}
        onClick=${toggleTabProperty(dispatch, 'disabled', id)}
      />
      <${SettingsButton} icon=${disableNotifications ? 'fa-bell-slash' : 'fa-bell'}
        title=${disableNotifications ? 'Notifications disabled. Click to enable' : 'Notifications enabled. Click to disable'}
        onClick=${toggleTabProperty(dispatch, 'disableNotifications', id)}
      />
      <${SettingsButton} icon='fa-trash' title='Delete tab'
        onClick=${() => dispatch({type: ACTIONS.REMOVE, payload: {id}})}
      /> 
    </div>
    <${TabAdvancedSettings} dispatch=${dispatch} id=${id} expanded=${expanded} disabled=${disabled}
      ...${tab}
    />
  </div>
`);

export const ServicesPane = ({dispatch, state}) => {
  const onNewTabInput = ({target: {value}}) => dispatch({
    type: ACTIONS.UPDATE_NEW_TAB_VALUE,
    payload: value
  });
  const onAddTab = addTab({dispatch});
  const onNewKeyDown = ({code}) => {
    if (code === 'Enter' || code === 'NumpadEnter') {
      onAddTab();
    }
  };

  return isPaneActive(state)(ServicesPane.id) && html`
    <h2 class='title'>Services</h2>
    <${Card} className='settings__services'>
      <div class='settings__new-tab'>
        <div class="control">
          <input type="text"
            class="input ${newTabClass(state)}"
            placeholder="https://web.whatsapp.com"
            value=${state.newTabValue}
            oninput=${onNewTabInput}
            onkeydown=${onNewKeyDown}
          />
        </div>
        <${SettingsButton} icon='fa-plus' onClick=${onAddTab} disabled=${!state.newTabValid} />
      </div>
      <div class="settings__tabs container field">
        ${state.tabs.map(tab => (html`
          <${TabEntry}
            dispatch=${dispatch} expanded=${state.expandedTabs.includes(tab.id)} invalidTabs=${state.invalidTabs}
            ...${tab}
          />
      `))}
      </div>
    </${Card}>
  `;
};

ServicesPane.id = 'services';
