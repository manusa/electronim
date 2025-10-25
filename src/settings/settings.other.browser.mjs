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
import {CLOSE_BUTTON_BEHAVIORS, ELECTRONIM_VERSION, html, Button, Card, Icon, Select} from '../components/index.mjs';
import {
  isPaneActive,
  closeButtonBehavior,
  setProperty,
  toggleProperty
} from './settings.reducer.browser.mjs';
import {SettingsOption, SettingsRow} from './settings.common.browser.mjs';

export const OtherPane = ({dispatch, state}) => {
  const onSettingsExport = () => globalThis.electron.settingsExport();
  const onSettingsImport = () => globalThis.electron.settingsImport();
  const onSettingsOpenFolder = () => globalThis.electron.settingsOpenFolder();
  const dispatchSetProperty = setProperty({dispatch});
  const setCloseButtonBehavior = e => dispatchSetProperty({property: 'closeButtonBehavior', value: e.target.value});
  return isPaneActive(state)(OtherPane.id) && html`
    <h2 class='title'><${Icon}>${Icon.more}</${Icon}>Other</h2>
    <${Card} className='settings__other'>
      <${SettingsOption}
          className='settings__global-notifications'
          label='Disable notifications globally'
          icon=${state.disableNotificationsGlobally ? Icon.notificationsOff : Icon.notifications}
          checked=${state.disableNotificationsGlobally}
          onClick=${toggleProperty({dispatch, property: 'disableNotificationsGlobally'})}
      />
      <${Card.Divider} />
      <${SettingsRow}>
        <${Select}
            data-testid='settings-close-button-behavior-select'
            label='Close button behavior'
            value=${closeButtonBehavior(state)} onChange=${setCloseButtonBehavior}
        >
          <${Select.Option} value=${CLOSE_BUTTON_BEHAVIORS.quit}>Quit</${Select.Option}>
          <${Select.Option} value=${CLOSE_BUTTON_BEHAVIORS.minimize}>Minimize</${Select.Option}>
        </${Select}>
      </${SettingsRow}>
      <${SettingsOption}
          className='settings__tray'
          label='Show ElectronIM in System Tray'
          icon=${Icon.inbox}
          checked=${state.trayEnabled}
          onClick=${toggleProperty({dispatch, property: 'trayEnabled'})}
      />
      <${SettingsOption}
          className='settings__start-minimized'
          label='Start ElectronIM minimized'
          icon=${Icon.minimize}
          checked=${state.startMinimized}
          onClick=${toggleProperty({dispatch, property: 'startMinimized'})}
      />
      <${SettingsOption}
          className='settings__always-on-top'
          label='Always on top'
          icon=${Icon.keep}
          checked=${state.alwaysOnTop}
          onClick=${toggleProperty({dispatch, property: 'alwaysOnTop'})}
      />
      <${Card.Divider} />
      <${SettingsRow}>
        <div class='settings__import-export'>
          <${Button}
              className='settings__export'
              icon=${Icon.fileSave}
              title='Export settings to file'
              onClick=${onSettingsExport}
          >
            Export
          </${Button}>
          <${Button}
              className='settings__import'
              icon=${Icon.fileOpen}
              title='Import settings from file'
              onClick=${onSettingsImport}
          >
            Import
          </${Button}>
          <${Button}
              className='settings__open-folder'
              icon=${Icon.preview}
              title='Open ElectronIM folder'
              onClick=${onSettingsOpenFolder}
          >
            Open Folder
          </${Button}>
        </div>
      </${SettingsRow}>
      <${Card.Divider} />
      <div data-testid='settings-electronim-version'>
        ElectronIM version ${ELECTRONIM_VERSION}
      </div>
    </${Card}>
  `;
};

OtherPane.id = 'other';
