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
const {fireEvent, waitFor} = require('@testing-library/dom');

const mockDOM = () => {
  document.body.innerHTML = '';
  const $root = document.createElement('div');
  $root.innerHTML = '<div class="settings container is-fluid"></div>';
  document.body.append($root);
};

describe('Settings in Browser test suite', () => {
  let mockDictionaries;
  let mockTabs;
  let mockIpcRenderer;
  let spyUseReducer;
  let dispatch;
  beforeEach(() => {
    mockDictionaries = {available: {
      en: {name: 'English'},
      es: {name: 'Spanish'}
    }, enabled: ['en']};
    mockTabs = [
      {id: '1', url: 'https://initial-tab.com', sandboxed: true},
      {id: '2', url: 'https://initial-tab-2.com', disabled: true, disableNotifications: true}
    ];
    mockIpcRenderer = {
      send: jest.fn()
    };
    window.preact = require('preact');
    window.preactHooks = require('preact/hooks');
    spyUseReducer = jest.spyOn(window.preactHooks, 'useReducer');
    window.htm = require('htm');
    window.APP_EVENTS = {};
    window.ELECTRONIM_VERSION = '1.33.7';
    window.dictionaries = mockDictionaries;
    window.tabs = mockTabs;
    window.ipcRenderer = mockIpcRenderer;
    window.disableNotificationsGlobally = false;
    mockDOM();
    jest.isolateModules(() => {
      require('../browser-settings');
    });
    dispatch = spyUseReducer.mock.results.reverse()[0].value[1];
  });
  describe('Main Button events', () => {
    test('Submit should send form data', () => {
      // Given
      window.APP_EVENTS = {settingsSave: 'Save my settings'};
      // When
      fireEvent.click(document.querySelector('.settings__submit'));
      // Then
      expect(mockIpcRenderer.send).toHaveBeenCalledTimes(1);
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('Save my settings',
        {
          tabs: [
            {id: '1', url: 'https://initial-tab.com', sandboxed: true},
            {id: '2', url: 'https://initial-tab-2.com', disabled: true, disableNotifications: true}
          ],
          enabledDictionaries: ['en'],
          disableNotificationsGlobally: false
        });
    });
    test('Cancel should send close dialog event', () => {
      // Given
      window.APP_EVENTS = {closeDialog: 'Cancel my settings'};
      // When
      fireEvent.click(document.querySelector('.settings__cancel'));
      // Then
      expect(mockIpcRenderer.send).toHaveBeenCalledTimes(1);
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('Cancel my settings');
    });
    test('Toggle global notifications should check input', async () => {
      // Given
      const $notificationCheckbox = document.querySelector('.settings__global-notifications input');
      expect($notificationCheckbox.checked).toBe(false);
      // When
      fireEvent.click($notificationCheckbox);
      // Then
      await waitFor(() => {
        expect($notificationCheckbox.checked).toBe(true);
      });
    });
  });
  describe('New tab Input field', () => {
    let $tabContainer;
    let $input;
    let $addTabButton;
    let $submitButton;
    beforeEach(() => {
      $input = document.querySelector('.settings__new-tab input[type="text"].input');
      $addTabButton = document.querySelector('.settings__new-tab .button');
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
      expect($tabContainer.childElementCount).toBe(2);
    });
    describe('keydown event, Enter key with URLS', () => {
      test('Empty URL, should do nothing', async () => {
        // Given
        fireEvent.input($input, {target: {value: ''}});
        // When
        fireEvent.keyDown($input, {code: 'Enter'});
        // Then
        expect($tabContainer.childElementCount).toBe(2);
        expect($addTabButton.hasAttribute('disabled')).toBe(true);
        expect($submitButton.hasAttribute('disabled')).toBe(false);
      });
      test('Invalid URL, should set input invalid', async () => {
        // Given
        fireEvent.input($input, {target: {value: 'invalid:1337:url'}});
        // When
        fireEvent.keyDown($input, {code: 'Enter'});
        // Then
        expect($tabContainer.childElementCount).toBe(2);
        await waitFor(() =>
          expect($input.classList.contains('is-danger')).toBe(true));
        expect($tabContainer.querySelectorAll('.settings__tab .settings__tab-main input').length).toBe(2);
        expect($input.value).toBe('invalid:1337:url');
        expect($addTabButton.hasAttribute('disabled')).toBe(true);
        expect($submitButton.hasAttribute('disabled')).toBe(true);
      });
      test('Valid URL without protocol, should add new url with default protocol', async () => {
        // Given
        fireEvent.input($input, {target: {value: 'info.cern.ch'}});
        // When
        fireEvent.keyDown($input, {code: 'Enter'});
        // Then
        await waitFor(() =>
          expect($tabContainer.childElementCount).toBe(3));
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
        fireEvent.keyDown($input, {code: 'Enter'});
        // Then
        await waitFor(() =>
          expect($tabContainer.childElementCount).toBe(3));
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
      test('Valid URL, should add success class', async () => {
        // When
        fireEvent.input($input, {target: {value: 'http://info.cern.ch'}});
        // Then
        await waitFor(() =>
          expect($input.classList.contains('is-success')).toBe(true));
        expect($input.classList.contains('is-danger')).toBe(false);
        expect($addTabButton.hasAttribute('disabled')).toBe(false);
        expect($submitButton.hasAttribute('disabled')).toBe(true);
      });
      test('Invalid URL, should add danger class', async () => {
        // When
        fireEvent.input($input, {target: {value: 'http://invalid:1337:url'}});
        // Then
        await waitFor(() =>
          expect($input.classList.contains('is-danger')).toBe(true));
        expect($input.classList.contains('is-success')).toBe(false);
        expect($addTabButton.hasAttribute('disabled')).toBe(true);
        expect($submitButton.hasAttribute('disabled')).toBe(true);
      });
    });
    test('addTabButton, click with valid URL, should add tab', async () => {
      // Given
      fireEvent.input($input, {target: {value: 'info.cern.ch'}});
      // When
      fireEvent.click($addTabButton);
      // Then
      await waitFor(() =>
        expect($tabContainer.childElementCount).toBe(3));
      expect($tabContainer.querySelectorAll('.settings__tab .settings__tab-main input')[2].value)
        .toBe('https://info.cern.ch');
      expect($input.value).toBe('');
      expect($addTabButton.hasAttribute('disabled')).toBe(true);
      expect($submitButton.hasAttribute('disabled')).toBe(false);
    });
  });
  describe('Tab events', () => {
    test('Notification disabled icon click, should enable notification', async () => {
      // Given
      const $notificationEnabledIcon = document.querySelector('.settings__tabs .icon .fa-bell-slash');
      // When
      fireEvent.click($notificationEnabledIcon);
      // Then
      await waitFor(() =>
        expect($notificationEnabledIcon.classList.contains('fa-bell-slash')).toBe(false));
      expect($notificationEnabledIcon.classList.contains('fa-bell')).toBe(true);
    });
    test('Notification enabled icon click, should disable notification', async () => {
      // Given
      const $notificationEnabledIcon = document.querySelector('.settings__tabs .icon .fa-bell');
      // When
      fireEvent.click($notificationEnabledIcon);
      // Then
      await waitFor(() =>
        expect($notificationEnabledIcon.classList.contains('fa-bell')).toBe(false));
      expect($notificationEnabledIcon.classList.contains('fa-bell-slash')).toBe(true);
    });
    test('Trash icon click, should remove tab', async () => {
      // Given
      const $tabContainer = document.querySelector('.settings__tabs');
      const $trashIcon = $tabContainer.querySelector('.icon .fa-trash');
      const initialChildren = $tabContainer.childElementCount;
      expect(initialChildren).toBeGreaterThan(0);
      // When
      fireEvent.click($trashIcon);
      // Then
      await waitFor(() =>
        expect($tabContainer.childElementCount).toBe(initialChildren - 1));
    });
    describe('Expand/Collapse icon click', () => {
      test('collapsed tab, should expand tab', async () => {
        // Given
        const $expandIcon = document.querySelector('.settings__tab[data-id="1"] .icon .fa-chevron-right');
        const $collapsedTab = $expandIcon.closest('.settings__tab');
        expect($collapsedTab.classList.contains('settings__tab--expanded')).toBe(false);
        // When
        fireEvent.click($expandIcon);
        // Then
        await waitFor(() =>
          expect($expandIcon.classList.contains('fa-chevron-down')).toBe(true));
        expect($collapsedTab.classList.contains('settings__tab--expanded')).toBe(true);
      });
      test('expanded tab, should collapse tab', async () => {
        // Given
        await dispatch({type: 'TOGGLE_TAB_EXPANDED', payload: '2'});
        const $tabIcon = document.querySelector('.settings__tab[data-id="2"] .icon');
        await waitFor(() => expect($tabIcon.title).toEqual('Collapse'));
        const $expandedTab = $tabIcon.closest('.settings__tab');
        expect($expandedTab.classList.contains('settings__tab--expanded')).toBe(true);
        const $collapseIcon = $tabIcon.querySelector('.fa-chevron-down');
        // When
        fireEvent.click($collapseIcon);
        // Then
        await waitFor(() =>
          expect($collapseIcon.classList.contains('fa-chevron-right')).toBe(true));
        expect($expandedTab.classList.contains('settings__tab--expanded')).toBe(false);
      });
      describe('Advanced settings', () => {
        test('Disable checkbox click, enabled tab, should disable', async () => {
          // Given
          await dispatch({type: 'TOGGLE_TAB_EXPANDED', payload: '1'});
          const $disableCheckBox = document.querySelector('.settings__tab-advanced .checkbox .fa-eye');
          // When
          fireEvent.click($disableCheckBox);
          // Then
          await waitFor(() =>
            expect($disableCheckBox.classList.contains('fa-eye')).toBe(false));
          expect($disableCheckBox.classList.contains('fa-eye-slash')).toBe(true);
        });
        test('Disable checkbox click, disabled tab, should enable', async () => {
          // Given
          await dispatch({type: 'TOGGLE_TAB_EXPANDED', payload: '2'});
          const $disableCheckBox = document.querySelector('.settings__tab-advanced .checkbox .fa-eye-slash');
          // When
          fireEvent.click($disableCheckBox);
          // Then
          await waitFor(() =>
            expect($disableCheckBox.classList.contains('fa-eye-slash')).toBe(false));
          expect($disableCheckBox.classList.contains('fa-eye')).toBe(true);
        });
        test('Sandbox checkbox click, sandboxed session, should unlock', async () => {
          // Given
          await dispatch({type: 'TOGGLE_TAB_EXPANDED', payload: '1'});
          const $lockCheckBox = document.querySelector('.settings__tab-advanced .checkbox .fa-lock');
          // When
          fireEvent.click($lockCheckBox);
          // Then
          await waitFor(() =>
            expect($lockCheckBox.classList.contains('fa-lock')).toBe(false));
          expect($lockCheckBox.classList.contains('fa-lock-open')).toBe(true);
        });
        test('Sandbox checkbox click, non-sandboxed session, should lock', async () => {
          // Given
          await dispatch({type: 'TOGGLE_TAB_EXPANDED', payload: '2'});
          const $lockCheckBox = document.querySelector('.settings__tab-advanced .checkbox .fa-lock-open');
          // When
          fireEvent.click($lockCheckBox);
          // Then
          await waitFor(() =>
            expect($lockCheckBox.classList.contains('fa-lock-open')).toBe(false));
          expect($lockCheckBox.classList.contains('fa-lock')).toBe(true);
        });
      });
    });
  });
  describe('Dictionary events', () => {
    let $dictionaries;
    beforeEach(() => {
      $dictionaries = document.querySelector('.settings__dictionaries');
    });
    test('toggle active dictionary, should uncheck dictionary', async () => {
      // Given
      const $enDict = $dictionaries.querySelector('input[value=en]');
      expect($enDict.checked).toBe(true);
      // When
      fireEvent.click($enDict);
      // Then
      waitFor(() => expect($enDict.checked).toBe(false));
    });
    test('toggle inactive dictionary, should check dictionary', async () => {
      // Given
      const $esDict = $dictionaries.querySelector('input[value=es]');
      expect($esDict.checked).toBe(false);
      // When
      fireEvent.click($esDict);
      // Then
      waitFor(() => expect($esDict.checked).toBe(true));
    });
  });
});
