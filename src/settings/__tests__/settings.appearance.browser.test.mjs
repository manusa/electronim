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
import {jest} from '@jest/globals';
import {loadDOM} from '../../__tests__/index.mjs';
import {findByTestId, getByText} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import {testEnvironment} from './settings.browser.mjs';

describe('Settings (Appearance) in Browser test suite', () => {
  let settings;
  let user;
  beforeEach(async () => {
    jest.resetModules();
    ({settings} = await testEnvironment());
    await import('../../../bundles/settings.preload');
    await loadDOM({meta: import.meta, path: ['..', 'index.html']});
    user = userEvent.setup(document);
    // Show appearance settings pane
    await user.click(getByText(document.querySelector('.material3.navigation-rail'), 'Appearance'));
  });
  describe('Appearance pane', () => {
    test('Shows the appearance card', () => {
      const $appearanceCard = document.querySelector('.settings__appearance');
      expect($appearanceCard).not.toBeNull();
      expect($appearanceCard.classList.contains('material3')).toBe(true);
      expect($appearanceCard.classList.contains('card')).toBe(true);
    });
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
      expect(settings.loadSettings()).toEqual(expect.objectContaining({
        theme: 'light'
      }));
    });
  });
  describe('Application Title', () => {
    let $applicationTitleContainer;
    let $input;
    beforeEach(async () => {
      $applicationTitleContainer = await findByTestId(document, 'settings-application-title');
      $input = $applicationTitleContainer.querySelector('input');
    });
    test('Shows the application title input field', () => {
      expect($applicationTitleContainer).not.toBeNull();
      expect($input).not.toBeNull();
    });
    test('Input has correct placeholder', () => {
      const $placeholder = $applicationTitleContainer.querySelector('.text-field__placeholder');
      expect($placeholder.textContent).toBe('ElectronIM');
    });
    test('Input has max length of 100', () => {
      expect($input.maxLength).toBe(100);
    });
    test('Custom application title can be entered and saved', async () => {
      await user.clear($input);
      await user.type($input, 'My Custom IM');
      await user.click(document.querySelector('.settings__submit'));
      expect(settings.loadSettings()).toEqual(expect.objectContaining({
        applicationTitle: 'My Custom IM'
      }));
    });
    test('Empty application title is saved as empty string', async () => {
      await user.clear($input);
      await user.click(document.querySelector('.settings__submit'));
      const savedSettings = settings.loadSettings();
      expect(savedSettings.applicationTitle).toBe('');
    });
    test('Empty application title overwrites previous custom title', async () => {
      settings.updateSettings({applicationTitle: 'Previous Title'});
      await user.clear($input);
      await user.click(document.querySelector('.settings__submit'));
      const savedSettings = settings.loadSettings();
      expect(savedSettings.applicationTitle).toBe('');
    });
  });
});
