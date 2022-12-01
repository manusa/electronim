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
import {jest} from '@jest/globals';
import {loadDOM} from '../../__tests__/index.mjs';
import {findByTestId, fireEvent, getByText, waitFor} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import {ipcRenderer} from './settings.browser.mjs';

describe('Settings (Other) in Browser test suite', () => {
  let mockIpcRenderer;
  let user;
  beforeEach(async () => {
    jest.resetModules();
    mockIpcRenderer = ipcRenderer();
    await import('../../../bundles/settings.preload');
    window.ipcRenderer = mockIpcRenderer;
    await loadDOM({meta: import.meta, path: ['..', 'index.html']});
    user = userEvent.setup(document);
    // Show other settings pane
    await user.click(getByText(document.querySelector('.material3.navigation-rail'), 'Other'));
  });
  describe('Theme selection', () => {
    let $themeContainer;
    beforeEach(async () => {
      $themeContainer = await findByTestId(document, 'settings-theme-select');
    });
    test('Select shows the current theme', () => {
      expect($themeContainer.querySelector('select').value).toBe('dark');
    });
    test('Different theme can be selected', async () => {
      await user.selectOptions($themeContainer.querySelector('select'), 'light');
      await user.click(document.querySelector('.settings__submit'));
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('settingsSave', expect.objectContaining({
        theme: 'light'
      }));
    }, 10000);
  });
  describe('Toggle disable global notifications click', () => {
    let $notificationsSwitch;
    beforeEach(() => {
      // In tests notifications are "Disable global notifications" is disabled by default
      $notificationsSwitch = document.querySelector('.settings__global-notifications .switch input');
    });
    test('when notifications enabled, should check input', async () => {
      // Given
      expect($notificationsSwitch.checked).toBe(false);
      // When
      fireEvent.click($notificationsSwitch);
      // Then
      await waitFor(() => expect($notificationsSwitch.checked).toBe(true));
    });
    test('when notifications disabled, should uncheck input', async () => {
      // Given
      fireEvent.click($notificationsSwitch);
      await waitFor(() => expect($notificationsSwitch.checked).toBe(true));
      // When
      fireEvent.click($notificationsSwitch);
      // Then
      await waitFor(() => expect($notificationsSwitch.checked).toBe(false));
    });
  });
  describe('Close button behavior selection', () => {
    let $closeButtonBehaviorContainer;
    beforeEach(async () => {
      $closeButtonBehaviorContainer = await findByTestId(document, 'settings-close-button-behavior-select');
    });
    test('Select shows quit', () => {
      expect($closeButtonBehaviorContainer.querySelector('select').value).toBe('quit');
    });
    test('Different behavior can be selected', async () => {
      await user.selectOptions($closeButtonBehaviorContainer.querySelector('select'), 'minimize');
      await user.click(document.querySelector('.settings__submit'));
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('settingsSave', expect.objectContaining({
        closeButtonBehavior: 'minimize'
      }));
    }, 10000);
  });
  describe('Toggle System Tray click', () => {
    let $traySwitch;
    beforeEach(() => {
      // In tests, tray is enabled by default
      $traySwitch = document.querySelector('.settings__tray .switch input');
    });
    test('when tray enabled, should uncheck input', async () => {
      // Given
      expect($traySwitch.checked).toBe(true);
      // When
      fireEvent.click($traySwitch);
      // Then
      await waitFor(() => expect($traySwitch.checked).toBe(false));
    });
    test('when tray disabled, should check input', async () => {
      // Given
      fireEvent.click($traySwitch);
      await waitFor(() => expect($traySwitch.checked).toBe(false));
      // When
      fireEvent.click($traySwitch);
      // Then
      await waitFor(() => expect($traySwitch.checked).toBe(true));
    });
  });
  test('ElectronIM version is visible', async () => {
    const $electronimVersion = await findByTestId(document, 'settings-electronim-version');
    expect($electronimVersion.textContent).toBe('ElectronIM version 0.0.0');
  });
});
