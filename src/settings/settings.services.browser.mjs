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
import {html, Card, Icon, IconButton, TextField} from '../components/index.mjs';
import {SettingsOption} from './settings.common.browser.mjs';
import {ACTIONS, addTab, isPaneActive, setTabProperty, toggleTabProperty} from './settings.reducer.browser.mjs';

const disabledIcon = disabled => (disabled === true ? Icon.visibilityOff : Icon.visibility);
const notificationIcon = disabled => (disabled === true ? Icon.notificationsOff : Icon.notifications);
const sandboxedIcon = sandboxed => (sandboxed === true ? Icon.lock : Icon.lockOpen);

const ExpandButton = ({dispatch, id, expanded = false}) => {
  const properties = {
    className: 'expand-button',
    icon: Icon.expandMore,
    title: expanded ? 'Collapse' : 'Expand (show advanced settings)',
    onClick: () => dispatch({type: ACTIONS.TOGGLE_TAB_EXPANDED, payload: id})
  };
  return html`
    <${IconButton} ...${properties} />
  `;
};

const TabAdvancedSettings = (
  {dispatch, id, sandboxed = false}
) => html`
  <div class='settings__tab-advanced'>
    <${SettingsOption}
      onClick=${toggleTabProperty(dispatch, 'sandboxed', id)}
      checked=${sandboxed}
      icon=${sandboxedIcon(sandboxed)}
      label='Sandbox'
      className='sandboxed-toggle'
      title='Use an isolated/sandboxed session for this tab'
    />
  </div>
`;

const TabEntry = ({
  dispatch, invalidTabs, id, expanded, url, disabled, disableNotifications = false, ...tab
}) => (html`
  <${Card.Divider} />
  <div class='settings__tab ${expanded ? 'settings__tab--expanded' : ''}' data-id=${id}>
    <div class='settings__tab-main'>
      <${ExpandButton} dispatch=${dispatch} id=${id} expanded=${expanded} />
      <${TextField}
        hasError=${invalidTabs.has(id)}
        onInput=${({target: {value}}) => setTabProperty({dispatch, property: 'url', value, id})}
        value=${url}
      />
      <${IconButton} icon=${disabledIcon(disabled)} data-testid='button-disable'
        title=${disabled ? 'Tab disabled. Click to enable' : 'Tab enabled. Click to disable'}
        onClick=${toggleTabProperty(dispatch, 'disabled', id)}
      />
      <${IconButton} icon=${notificationIcon(disableNotifications)} data-testid='button-notification'
        title=${disableNotifications ? 'Notifications disabled. Click to enable' : 'Notifications enabled. Click to disable'}
        onClick=${toggleTabProperty(dispatch, 'disableNotifications', id)}
      />
      <${IconButton} icon=${Icon.delete} title='Delete tab' data-testid='button-delete'
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
        <${TextField}
            label='Service URL'
            placeholder='https://web.whatsapp.com' 
            value=${state.newTabValue}
            onInput=${onNewTabInput}
            onKeyDown=${onNewKeyDown}
            hasError=${state.newTabValue.length !== 0 && !state.newTabValid}
        />
        <${IconButton} icon=${Icon.add} onClick=${onAddTab} disabled=${!state.newTabValid} />
      </div>
      <div class='settings__tabs'>
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
