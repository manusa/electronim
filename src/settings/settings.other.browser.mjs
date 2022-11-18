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
import {ELECTRONIM_VERSION, Card, Checkbox, HorizontalField, Select, html} from '../components/index.mjs';
import {
  isPaneActive,
  setTheme,
  toggleNotifications
} from './settings.reducer.browser.mjs';

export const OtherPane = ({dispatch, state}) => isPaneActive(state)(OtherPane.id) && html`
  <h2 class='title'>Other</h2>
  <${Card} className='settings__other'>
    <div style=${{display: 'flex', justifyContent: 'flex-start' /* eslint-disable no-warning-comments *//*
    TODO: remove when Bulma is out
    */}}>
      <${HorizontalField} label='Theme' data-testid='settings-theme-select'>
        <${Select} value=${state.theme} onChange=${e => setTheme({dispatch})(e.target.value)}>
          <${Select.Option} value='system'>system</${Select.Option}>
          <${Select.Option} value='light'>light</${Select.Option}>
          <${Select.Option} value='dark'>dark</${Select.Option}>
        </${Select}>
      </${HorizontalField}>
    </div>
    <${Card.Divider} />
    <div class="settings__global-notifications container">
      <${Checkbox}
        label="Disable notifications globally"
        icon=${state.disableNotificationsGlobally ? 'fa-bell-slash' : 'fa-bell'}
        checked=${state.disableNotificationsGlobally}
        value=${state.disableNotificationsGlobally}
        onClick=${toggleNotifications({dispatch})}
      />
    </div>
    <${Card.Divider} />
    <div class='is-italic' data-testid='settings-electronim-version'>
      ElectronIM version ${ELECTRONIM_VERSION}
    </div>
  </${Card}>
`;

OtherPane.id = 'other';
