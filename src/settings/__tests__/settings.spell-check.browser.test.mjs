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
import {fireEvent, getByText, waitFor} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import {ipcRenderer} from './settings.browser.mjs';

describe('Settings (Spell check) in Browser test suite', () => {
  let mockIpcRenderer;
  let $spellCheckContainer;
  beforeEach(async () => {
    jest.resetModules();
    mockIpcRenderer = ipcRenderer();
    await import('../../../bundles/settings.preload');
    window.ipcRenderer = mockIpcRenderer;
    await loadDOM({meta: import.meta, path: ['..', 'index.html']});
    const user = userEvent.setup(document);
    // Show Spell check settings pane
    await user.click(getByText(document.querySelector('.material3.navigation-rail'), 'Spell check'));
    $spellCheckContainer = document.querySelector('.settings__spell-check');
  });
  test('toggle use native spell checker, should check use native spell checker', async () => {
    // Given
    const $useNativeSpellChecker = $spellCheckContainer
      .querySelector('.settings__use-native-spell-checker input.switch__input');
    expect($useNativeSpellChecker.checked).toBe(false);
    // When
    fireEvent.click($useNativeSpellChecker);
    // Then
    await waitFor(() => expect($useNativeSpellChecker.checked).toBe(true));
  });
  describe('dictionaries', () => {
    let $dictionaries;
    beforeEach(() => {
      $dictionaries = $spellCheckContainer.querySelector('.settings__dictionaries');
    });
    test('toggle active dictionary, should uncheck dictionary', async () => {
      // Given
      const $enDict = $dictionaries.querySelector('input[value=en]');
      expect($enDict.checked).toBe(true);
      // When
      fireEvent.click($enDict);
      // Then
      await waitFor(() => expect($enDict.checked).toBe(false));
    });
    test('toggle inactive dictionary, should check dictionary', async () => {
      // Given
      const $esDict = $dictionaries.querySelector('input[value=es]');
      expect($esDict.checked).toBe(false);
      // When
      fireEvent.click($esDict);
      // Then
      await waitFor(() => expect($esDict.checked).toBe(true));
    });
    test('when not native, dictionaries should intersect available', async () => {
      await waitFor(() => expect($dictionaries.querySelectorAll('input').length).toBe(2));
    });
    test('when native, dictionaries should intersect available', async () => {
      // Given
      const $useNativeSpellChecker = $spellCheckContainer
        .querySelector('.settings__use-native-spell-checker input.switch__input');
      // When
      fireEvent.click($useNativeSpellChecker);
      // Then
      await waitFor(() => expect($dictionaries.querySelectorAll('input').length).toBe(1));
    });
  });
});
