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
import {jest} from '@jest/globals';
import {loadDOM} from '../../__tests__/index.mjs';
import {ipcRenderer} from './settings.browser.mjs';
import {fireEvent, getByTestId, getByText, waitFor} from '@testing-library/dom';

describe('Settings in Browser test suite', () => {
  let mockIpcRenderer;
  beforeEach(async () => {
    jest.resetModules();
    mockIpcRenderer = ipcRenderer();
    await import('../../../bundles/settings.preload');
    window.ELECTRONIM_VERSION = '1.33.7';
    window.ipcRenderer = mockIpcRenderer;
    await loadDOM({meta: import.meta, path: ['..', 'index.html']});
  });
  describe('TopApp Bar', () => {
    describe('Main Button states', () => {
      describe('With pre-existing settings', () => {
        test('Cancel/Back button is enabled', () => {
          const button = document.querySelector('.top-app-bar .leading-navigation-icon');
          expect(button.hasAttribute('disabled')).toBe(false);
        });
      });
      describe('With no pre-existing settings', () => {
        beforeEach(async () => {
          jest.resetModules();
          mockIpcRenderer.mockCurrentSettings.tabs = [];
          await loadDOM({meta: import.meta, path: ['..', 'index.html']});
        });
        test('Cancel/Back button is disabled', () => {
          const button = document.querySelector('.top-app-bar .leading-navigation-icon');
          expect(button.getAttribute('disabled')).toBe('true');
        });
        test('Save button is disabled', () => {
          const button = document.querySelector('.settings__submit');
          expect(button.getAttribute('disabled')).toBe('true');
        });
      });
    });
    describe('Main Button events', () => {
      test('Submit should send form data', () => {
        // When
        fireEvent.click(document.querySelector('.settings__submit'));
        // Then
        expect(mockIpcRenderer.send).toHaveBeenCalledTimes(1);
        expect(mockIpcRenderer.send).toHaveBeenCalledWith('settingsSave',
          {
            tabs: [
              {id: '1', url: 'https://initial-tab.com', sandboxed: true},
              {id: '2', url: 'https://initial-tab-2.com', disabled: true, disableNotifications: true}
            ],
            enabledDictionaries: ['en'],
            disableNotificationsGlobally: false,
            theme: 'dark',
            trayEnabled: true
          });
      });
      test('Cancel should send close dialog event', () => {
        // When
        fireEvent.click(document.querySelector('.top-app-bar .leading-navigation-icon'));
        // Then
        expect(mockIpcRenderer.send).toHaveBeenCalledTimes(1);
        expect(mockIpcRenderer.send).toHaveBeenCalledWith('closeDialog');
      });
    });
  });
  describe('Navigation Rail', () => {
    test('Shows navigation rail', () => {
      expect(document.querySelector('.material3.navigation-rail')).not.toBeNull();
    });
    test.each([
      {label: 'Services', icon: '\ue5c3'},
      {label: 'Spell check', icon: '\ue8ce'},
      {label: 'Other', icon: '\ue619'}
    ])('Shows navigation rail item $label with $icon', ({label, icon}) => {
      const items = Array.from(document.querySelectorAll('.navigation-rail-button'))
        .map(b => ({
          label: b.querySelector('.navigation-rail-button__label').textContent,
          icon: b.querySelector('.navigation-rail-button__icon').textContent}
        ));
      expect(items).toContainEqual({label, icon});
    });
  });
  describe('New tab Input field', () => {
    let $tabContainer;
    let $input;
    let $addTabButton;
    let $submitButton;
    beforeEach(() => {
      $input = document.querySelector('.settings__new-tab .material3.text-field input');
      $addTabButton = document.querySelector('.settings__new-tab .material3.icon-button');
      $tabContainer = document.querySelector('.settings__tabs');
      $submitButton = document.querySelector('.settings__submit');
    });
    test('key* events, Regular key press (No Enter), should only update input value', async () => {
      // When
      fireEvent.keyDown($input, {code: 'A'});
      fireEvent.keyPress($input, {code: 'A'});
      fireEvent.keyUp($input, {code: 'A'});
      fireEvent.input($input, {target: {value: 'A'}});
      // Then
      await waitFor(() => expect($input.value).toBe('A'));
      expect($tabContainer.querySelectorAll('.settings__tab').length).toBe(2);
    });
    describe.each([
      'Enter',
      'NumpadEnter'
    ])('keydown event, "%s" key with URLS', code => {
      test('Empty URL, should do nothing', async () => {
        // Given
        fireEvent.input($input, {target: {value: ''}});
        // When
        fireEvent.keyDown($input, {code});
        // Then
        expect($tabContainer.querySelectorAll('.settings__tab').length).toBe(2);
        expect($addTabButton.hasAttribute('disabled')).toBe(true);
        expect($submitButton.hasAttribute('disabled')).toBe(false);
      });
      test('Invalid URL, should set input invalid', async () => {
        // Given
        fireEvent.input($input, {target: {value: 'invalid:1337:url'}});
        // When
        fireEvent.keyDown($input, {code});
        // Then
        expect($tabContainer.querySelectorAll('.settings__tab').length).toBe(2);
        await waitFor(() =>
          expect($input.parentElement.classList.contains('errored')).toBe(true));
        expect($tabContainer.querySelectorAll('.settings__tab .settings__tab-main input').length).toBe(2);
        expect($input.value).toBe('invalid:1337:url');
        expect($addTabButton.hasAttribute('disabled')).toBe(true);
        expect($submitButton.hasAttribute('disabled')).toBe(true);
      });
      test('Valid URL without protocol, should add new url with default protocol', async () => {
        // Given
        fireEvent.input($input, {target: {value: 'info.cern.ch'}});
        // When
        fireEvent.keyDown($input, {code});
        // Then
        await waitFor(() =>
          expect($tabContainer.querySelectorAll('.settings__tab').length).toBe(3));
        expect($input.classList.contains('is-success')).toBe(false);
        expect($tabContainer.querySelectorAll('.settings__tab .settings__tab-main input')[2].value)
          .toBe('https://info.cern.ch');
        expect($input.value).toBe('');
        expect($addTabButton.hasAttribute('disabled')).toBe(true);
        expect($submitButton.hasAttribute('disabled')).toBe(false);
      });
      test('Valid URL wth protocol, should add new url with specified protocol', async () => {
        // Given
        fireEvent.input($input, {target: {value: 'http://info.cern.ch'}});
        // When
        fireEvent.keyDown($input, {code});
        // Then
        await waitFor(() =>
          expect($tabContainer.querySelectorAll('.settings__tab').length).toBe(3));
        await waitFor(() =>
          expect($input.classList.contains('is-success')).toBe(false));
        expect($tabContainer.querySelectorAll('.settings__tab .settings__tab-main input')[2].value)
          .toBe('http://info.cern.ch');
        expect($input.value).toBe('');
        expect($addTabButton.hasAttribute('disabled')).toBe(true);
        expect($submitButton.hasAttribute('disabled')).toBe(false);
      });
    });
    describe('input event', () => {
      test('Valid URL, should enable addTabButton', async () => {
        // When
        fireEvent.input($input, {target: {value: 'http://info.cern.ch'}});
        // Then
        await waitFor(() =>
          expect($addTabButton.hasAttribute('disabled')).toBe(false));
        expect($input.parentElement.classList.contains('errored')).toBe(false);
        expect($submitButton.hasAttribute('disabled')).toBe(true);
      });
      test('Invalid URL, should add danger class', async () => {
        // When
        fireEvent.input($input, {target: {value: 'http://invalid:1337:url'}});
        // Then
        await waitFor(() =>
          expect($input.parentElement.classList.contains('errored')).toBe(true));
        expect($addTabButton.hasAttribute('disabled')).toBe(true);
        expect($submitButton.hasAttribute('disabled')).toBe(true);
      });
    });
    test('addTabButton, click with valid URL, should add tab', async () => {
      // Given
      fireEvent.input($input, {target: {value: 'info.cern.ch'}});
      await waitFor(() => expect($addTabButton.getAttribute('disabled')).toBeFalsy());
      // When
      fireEvent.click($addTabButton);
      // Then
      await waitFor(() =>
        expect($tabContainer.querySelectorAll('.settings__tab').length).toBe(3));
      expect($tabContainer.querySelectorAll('.settings__tab .settings__tab-main input')[2].value)
        .toBe('https://info.cern.ch');
      expect($input.value).toBe('');
      expect($addTabButton.hasAttribute('disabled')).toBe(true);
      expect($submitButton.hasAttribute('disabled')).toBe(false);
    });
  });
  describe('Tab events', () => {
    describe('Disable icon click', () => {
      let $disableIcon;
      beforeEach(async () => {
        $disableIcon = getByTestId(document.querySelector('.settings__tab'), 'button-disable');
        // Ensure Tab is always enabled
        if ($disableIcon.textContent === '\ue8f5') {
          fireEvent.click($disableIcon);
          // eslint-disable-next-line jest/no-standalone-expect
          await waitFor(() => expect($disableIcon.textContent).toBe('\ue8f4'));
        }
      });
      test('with enabled tab, should disable', async () => {
        // When
        fireEvent.click($disableIcon);
        // Then
        await waitFor(() => expect($disableIcon.textContent).not.toBe('\ue8f4'));
        expect($disableIcon.textContent).toBe('\ue8f5');
      });
      test('with disabled tab, should enable', async () => {
        // Given
        fireEvent.click($disableIcon);
        await waitFor(() => expect($disableIcon.textContent).toBe('\ue8f5'));
        // When
        fireEvent.click($disableIcon);
        // Then
        await waitFor(() => expect($disableIcon.textContent).not.toBe('\ue8f5'));
        expect($disableIcon.textContent).toBe('\ue8f4');
      });
    });
    test('Notification disabled icon click, should enable notification', async () => {
      // Given
      const $notificationEnabledIcon = getByText(document.querySelector('.settings__tabs'), '\ue7f6');
      // When
      fireEvent.click($notificationEnabledIcon);
      // Then
      await waitFor(() =>
        expect($notificationEnabledIcon.textContent).not.toBe('\ue7f6'));
      expect($notificationEnabledIcon.textContent).toBe('\ue7f4');
    });
    test('Notification enabled icon click, should disable notification', async () => {
      // Given
      const $notificationEnabledIcon = getByText(document.querySelector('.settings__tabs'), '\ue7f4');
      // When
      fireEvent.click($notificationEnabledIcon);
      // Then
      await waitFor(() =>
        expect($notificationEnabledIcon.textContent).not.toBe('\ue7f4'));
      expect($notificationEnabledIcon.textContent).toBe('\ue7f6');
    });
    test('Trash icon click, should remove tab', async () => {
      // Given
      const $tabContainer = document.querySelector('.settings__tabs');
      const $trashIcon = getByText($tabContainer.querySelector('.settings__tab'), '\ue872');
      const initialChildren = $tabContainer.querySelectorAll('.settings__tab').length;
      expect(initialChildren).toBeGreaterThan(0);
      // When
      fireEvent.click($trashIcon);
      // Then
      await waitFor(() =>
        expect($tabContainer.querySelectorAll('.settings__tab').length).toBe(initialChildren - 1));
    });
    describe('Expand/Collapse icon click', () => {
      test('collapsed tab, should expand tab', async () => {
        // Given
        const $toggleIcon = getByText(document.querySelector('.settings__tab[data-id="1"]'), '\ue5cf');
        const $collapsedTab = $toggleIcon.closest('.settings__tab');
        expect($collapsedTab.classList.contains('settings__tab--expanded')).toBe(false);
        // When
        fireEvent.click($toggleIcon);
        // Then
        await waitFor(() =>
          expect($toggleIcon.getAttribute('title')).toStartWith('Collapse'));
        expect($collapsedTab.classList.contains('settings__tab--expanded')).toBe(true);
      });
      test('expanded tab, should collapse tab', async () => {
        // Given
        const $toggleIcon = getByText(document.querySelector('.settings__tab[data-id="2"]'), '\ue5cf');
        fireEvent.click($toggleIcon);
        await waitFor(() => expect($toggleIcon.title).toEqual('Collapse'));
        const $expandedTab = $toggleIcon.closest('.settings__tab');
        expect($expandedTab.classList.contains('settings__tab--expanded')).toBe(true);
        // When
        fireEvent.click($toggleIcon);
        // Then
        await waitFor(() =>
          expect($toggleIcon.getAttribute('title')).toStartWith('Expand'));
        expect($expandedTab.classList.contains('settings__tab--expanded')).toBe(false);
      });
      describe('Advanced settings', () => {
        describe('with sandboxed session', () => {
          let $settingsTab;
          let $toggleIcon;
          let $sandboxedEntry;
          beforeEach(async () => {
            $settingsTab = document.querySelector('.settings__tab[data-id="1"]');
            $toggleIcon = $settingsTab.querySelector('.expand-button');
            $sandboxedEntry = $settingsTab.querySelector('.sandboxed-toggle');
            if ($toggleIcon.title.startsWith('Expand')) {
              fireEvent.click($toggleIcon);
              // eslint-disable-next-line jest/no-standalone-expect
              await waitFor(() => expect($toggleIcon.title).toEqual('Collapse'));
            }
          });
          test('click on label, should unlock', async () => {
            // Given
            const $lockLabel = getByText($sandboxedEntry, 'Sandbox');
            // When
            fireEvent.click($lockLabel);
            // Then
            await waitFor(() => expect($settingsTab.textContent).not.toContain('\ue88d'));
            expect($settingsTab.textContent).toContain('\ue898');
          });
          test('click on switch, should unlock', async () => {
            // Given
            const $switch = $sandboxedEntry.querySelector('.material3.switch');
            // When
            fireEvent.click($switch);
            // Then
            await waitFor(() => expect($settingsTab.textContent).not.toContain('\ue88d'));
            expect($settingsTab.textContent).toContain('\ue898');
          });
        });
        describe('with non-sandboxed session', () => {
          let $settingsTab;
          let $toggleIcon;
          let $sandboxedEntry;
          beforeEach(async () => {
            $settingsTab = document.querySelector('.settings__tab[data-id="2"]');
            $toggleIcon = $settingsTab.querySelector('.expand-button');
            $sandboxedEntry = $settingsTab.querySelector('.sandboxed-toggle');
            if ($toggleIcon.title.startsWith('Expand')) {
              fireEvent.click($toggleIcon);
              // eslint-disable-next-line jest/no-standalone-expect
              await waitFor(() => expect($toggleIcon.title).toEqual('Collapse'));
            }
          });
          test('click on label, should unlock', async () => {
            // Given
            const $lockLabel = getByText($sandboxedEntry, 'Sandbox');
            // When
            fireEvent.click($lockLabel);
            // Then
            await waitFor(() => expect($settingsTab.textContent).not.toContain('\ue898'));
            expect($settingsTab.textContent).toContain('\ue88d');
          });
          test('click on switch, should unlock', async () => {
            // Given
            const $switch = $sandboxedEntry.querySelector('.material3.switch');
            // When
            fireEvent.click($switch);
            // Then
            await waitFor(() => expect($settingsTab.textContent).not.toContain('\ue898'));
            expect($settingsTab.textContent).toContain('\ue88d');
          });
        });
      });
    });
    describe('URL edit', () => {
      let $input;
      let $submitButton;
      beforeEach(() => {
        $input = document.querySelector('.settings__tab[data-id="1"] .text-field input');
        $submitButton = document.querySelector('.settings__submit');
      });
      test('with valid URL, should enable save button', async () => {
        // When
        fireEvent.input($input, {target: {value: 'https://info.cern.ch'}});
        // Then
        await waitFor(() => expect($submitButton.hasAttribute('disabled')).toBe(false));
      });
      test('with invalid URL, should disable save button', async () => {
        // When
        fireEvent.input($input, {target: {value: 'missing-protocol-info.cern.ch'}});
        // Then
        await waitFor(() => expect($submitButton.hasAttribute('disabled')).toBe(true));
      });
    });
  });
});
