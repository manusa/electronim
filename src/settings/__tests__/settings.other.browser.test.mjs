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
import {testEnvironment} from './settings.browser.mjs';

describe('Settings (Other) in Browser test suite', () => {
  let electron;
  let settings;
  let user;
  beforeEach(async () => {
    jest.resetModules();
    ({electron, settings} = await testEnvironment());
    await import('../../../bundles/settings.preload');
    await loadDOM({meta: import.meta, path: ['..', 'index.html']});
    user = userEvent.setup(document);
    // Show other settings pane
    await user.click(getByText(document.querySelector('.material3.navigation-rail'), 'Other'));
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
      expect(settings.loadSettings()).toEqual(expect.objectContaining({
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
  describe('Toggle Start Minimized click', () => {
    let $startMinimizedSwitch;
    beforeEach(() => {
      // In tests, start minimized is disabled by default
      $startMinimizedSwitch = document.querySelector('.settings__start-minimized .switch input');
    });
    test('when start minimized enabled, should uncheck input', async () => {
      // Given
      fireEvent.click($startMinimizedSwitch);
      await waitFor(() => expect($startMinimizedSwitch.checked).toBe(true));
      // When
      fireEvent.click($startMinimizedSwitch);
      // Then
      await waitFor(() => expect($startMinimizedSwitch.checked).toBe(false));
    });
    test('when start minimized disabled, should check input', async () => {
      // Given
      expect($startMinimizedSwitch.checked).toBe(false);
      // When
      fireEvent.click($startMinimizedSwitch);
      // Then
      await waitFor(() => expect($startMinimizedSwitch.checked).toBe(true));
    });
  });
  describe('Toggle Always On Top click', () => {
    let $alwaysOnTopSwitch;
    beforeEach(() => {
      // In tests, always on top is disabled by default
      $alwaysOnTopSwitch = document.querySelector('.settings__always-on-top .switch input');
    });
    test('when always on top disabled, should check input', async () => {
      // Given
      expect($alwaysOnTopSwitch.checked).toBe(false);
      // When
      fireEvent.click($alwaysOnTopSwitch);
      // Then
      await waitFor(() => expect($alwaysOnTopSwitch.checked).toBe(true));
    });
    test('when always on top enabled, should uncheck input', async () => {
      // Given
      fireEvent.click($alwaysOnTopSwitch);
      await waitFor(() => expect($alwaysOnTopSwitch.checked).toBe(true));
      // When
      fireEvent.click($alwaysOnTopSwitch);
      // Then
      await waitFor(() => expect($alwaysOnTopSwitch.checked).toBe(false));
    });
  });
  describe('Settings Export/Import and Directory', () => {
    let $exportButton;
    let $importButton;
    let $openFolderButton;
    beforeEach(() => {
      $exportButton = document.querySelector('.settings__export');
      $importButton = document.querySelector('.settings__import');
      $openFolderButton = document.querySelector('.settings__open-folder');
    });
    test('Export button triggers settingsExport IPC call', async () => {
      // Given
      const settingsExport = jest.fn();
      electron.ipcMain.once('settingsExport', settingsExport);
      // When
      await user.click($exportButton);
      // Then
      expect(settingsExport).toHaveBeenCalled();
    });
    test('Import button triggers settingsImport IPC call', async () => {
      // Given
      const settingsImport = jest.fn();
      electron.ipcMain.once('settingsImport', settingsImport);
      // When
      await user.click($importButton);
      // Then
      expect(settingsImport).toHaveBeenCalled();
    });
    test('Open Folder button triggers settingsOpenFolder IPC call', async () => {
      // Given
      const settingsOpenFolder = jest.fn();
      electron.ipcMain.once('settingsOpenFolder', settingsOpenFolder);
      // When
      await user.click($openFolderButton);
      // Then
      expect(settingsOpenFolder).toHaveBeenCalled();
    });
  });
  test('ElectronIM version is visible', async () => {
    const $electronimVersion = await findByTestId(document, 'settings-electronim-version');
    expect($electronimVersion.textContent).toBe('ElectronIM version 0.0.0');
  });
});
