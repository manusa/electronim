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
  beforeEach(() => {
    mockDictionaries = {available: {
      en: {name: 'English'},
      es: {name: 'Spanish'}
    }, enabled: ['en']};
    mockTabs = [
      {url: 'https://initial-tab.com', sandboxed: true},
      {url: 'https://initial-tab-2.com'}
    ];
    mockIpcRenderer = {
      send: jest.fn()
    };
    window.preact = require('preact');
    window.preactHooks = require('preact/hooks');
    window.htm = require('htm');
    window.APP_EVENTS = {};
    window.dictionaries = mockDictionaries;
    window.tabs = mockTabs;
    window.ipcRenderer = mockIpcRenderer;
    mockDOM();
    jest.isolateModules(() => {
      require('../browser-settings');
    });
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
        {tabs: [
          {url: 'https://initial-tab.com', sandboxed: true},
          {url: 'https://initial-tab-2.com'}
        ], enabledDictionaries: ['en']});
    });
    test('Cancel should send cancel event', () => {
      // Given
      window.APP_EVENTS = {settingsCancel: 'Cancel my settings'};
      // When
      fireEvent.click(document.querySelector('.settings__cancel'));
      // Then
      expect(mockIpcRenderer.send).toHaveBeenCalledTimes(1);
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('Cancel my settings');
    });
  });
  describe('New tab Input field', () => {
    let $tabContainer;
    let $input;
    let $addTabButton;
    let $submitButton;
    beforeEach(() => {
      $input = document.querySelector('.settings__new-tab .input');
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
        expect($tabContainer.querySelectorAll('.settings__tab input').length).toBe(2);
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
        expect($tabContainer.querySelectorAll('.settings__tab input')[2].value)
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
        expect($tabContainer.querySelectorAll('.settings__tab input')[2].value)
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
      expect($tabContainer.querySelectorAll('.settings__tab input')[2].value)
        .toBe('https://info.cern.ch');
      expect($input.value).toBe('');
      expect($addTabButton.hasAttribute('disabled')).toBe(true);
      expect($submitButton.hasAttribute('disabled')).toBe(false);
    });
  });
  describe('Tab events', () => {
    test('Lock icon click, sandboxed session, should unlock', async () => {
      // Given
      const $lockIcon = document.querySelector('.settings__tabs .icon .fa-lock');
      // When
      fireEvent.click($lockIcon);
      // Then
      await waitFor(() =>
        expect($lockIcon.classList.contains('fa-lock')).toBe(false));
      expect($lockIcon.classList.contains('fa-lock-open')).toBe(true);
    });
    test('Lock-open icon click, sandboxed session, should lock', async () => {
      // Given
      const $lockOpenIcon = document.querySelector('.settings__tabs .icon .fa-lock-open');
      // When
      fireEvent.click($lockOpenIcon);
      // Then
      await waitFor(() =>
        expect($lockOpenIcon.classList.contains('fa-lock-open')).toBe(false));
      expect($lockOpenIcon.classList.contains('fa-lock')).toBe(true);
    });
    test('Trash icon click, should remove tab', async () => {
      // Given
      const $tabContainer = document.querySelector('.settings__tabs');
      const $trashIcon = $tabContainer.querySelector('.icon .fa-trash');
      // When
      fireEvent.click($trashIcon);
      // Then
      await waitFor(() =>
        expect($tabContainer.childElementCount).toBe(0));
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
