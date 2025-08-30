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
import {APP_EVENTS, CLOSE_BUTTON_BEHAVIORS, ELECTRONIM_VERSION, html, Card, Icon, IconButton, Select} from '../components/index.mjs';
import {
  isPaneActive,
  closeButtonBehavior,
  setProperty,
  theme,
  toggleProperty
} from './settings.reducer.browser.mjs';
import {SettingsOption, SettingsRow} from './settings.common.browser.mjs';

const {ipcRenderer} = window;

export const OtherPane = ({dispatch, state}) => {
  const dispatchSetProperty = setProperty({dispatch});
  const setTheme = e => dispatchSetProperty({property: 'theme', value: e.target.value});
  const setCloseButtonBehavior = e => dispatchSetProperty({property: 'closeButtonBehavior', value: e.target.value});
  return isPaneActive(state)(OtherPane.id) && html`
    <h2 class='title'>Other</h2>
    <${Card} className='settings__other'>
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
      <${Card.Divider} />
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
      <${Card.Divider} />
      <${SettingsRow}>
        <div class='settings__import-export'>
          <div class='settings__import-export-section'>
            <span class='settings__import-export-label'>Settings Management</span>
            <div class='settings__import-export-buttons'>
              <${IconButton}
                  className='settings__export'
                  icon=${Icon.downloadFile}
                  title='Export settings to file'
                  onClick=${async () => {
    try {
      const result = await ipcRenderer.invoke(APP_EVENTS.settingsExport);
      if (result.success && !result.canceled) {
        // Could show a success message here if needed
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }}
              />
              <${IconButton}
                  className='settings__import'
                  icon=${Icon.fileUpload}
                  title='Import settings from file'
                  onClick=${async () => {
    try {
      const result = await ipcRenderer.invoke(APP_EVENTS.settingsImport);
      if (result.success && !result.canceled) {
        // Reload the page to reflect the new settings
        window.location.reload();
      }
    } catch (error) {
      console.error('Import failed:', error);
    }
  }}
              />
            </div>
          </div>
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
