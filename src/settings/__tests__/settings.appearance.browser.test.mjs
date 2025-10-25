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
import {getByText} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import {testEnvironment} from './settings.browser.mjs';

describe('Settings (Appearance) in Browser test suite', () => {
  let user;
  beforeEach(async () => {
    jest.resetModules();
    await testEnvironment();
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
});
