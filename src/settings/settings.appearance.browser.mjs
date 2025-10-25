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
import {isPaneActive, setProperty, theme} from './settings.reducer.browser.mjs';
import {SettingsRow} from './settings.common.browser.mjs';

export const AppearancePane = ({dispatch, state}) => {
  const dispatchSetProperty = setProperty({dispatch});
  const setTheme = e => dispatchSetProperty({property: 'theme', value: e.target.value});
  return isPaneActive(state)(AppearancePane.id) && html`
    <h2 class='title'><${Icon}>${Icon.palette}</${Icon}>Appearance</h2>
    <${Card} className='settings__appearance'>
      <${SettingsRow}>
        <${Select}
          data-testid='settings-theme-select'
          label='Theme' value=${theme(state)} onChange=${setTheme}
        >
          <${Select.Option} value='system'>system</${Select.Option}>
          <${Select.Option} value='light'>light</${Select.Option}>
          <${Select.Option} value='dark'>dark</${Select.Option}>
        </${Select}>
      </${SettingsRow}>
    </${Card}>
  `;
};

AppearancePane.id = 'appearance';
