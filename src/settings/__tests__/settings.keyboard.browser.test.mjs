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
import {getByText, waitFor, findByTestId} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import {testEnvironment} from './settings.browser.mjs';

describe('Settings (Keyboard) in Browser test suite', () => {
  let user;
  beforeEach(async () => {
    jest.resetModules();
    await testEnvironment();
    await import('../../../bundles/settings.preload');
    await loadDOM({meta: import.meta, path: ['..', 'index.html']});
    user = userEvent.setup(document);
    // Show Keyboard settings pane
    await user.click(getByText(document.querySelector('.material3.navigation-rail'), 'Keyboard'));
  });

  describe('Tab Switch Modifier', () => {
    let $tabSwitchContainer;
    let $tabSwitchSelect;
    let $tabSwitchSelectElement;
    beforeEach(async () => {
      $tabSwitchContainer = await findByTestId(document, 'settings-keyboard-tab-switch-modifier');
      $tabSwitchSelect = $tabSwitchContainer.querySelector('.material3.select');
      $tabSwitchSelectElement = $tabSwitchSelect.querySelector('select');
    });

    test('should display empty value by default', () => {
      expect($tabSwitchSelectElement.value).toBe('');
    });

    test('should allow selecting Alt modifier', async () => {
      // When
      await user.selectOptions($tabSwitchSelectElement, 'Alt');
      // Then
      expect($tabSwitchSelectElement.value).toBe('Alt');
    });

    test('should allow selecting Command modifier', async () => {
      // When
      await user.selectOptions($tabSwitchSelectElement, 'Command');
      // Then
      expect($tabSwitchSelectElement.value).toBe('Command');
    });

    test('should allow selecting Control modifier', async () => {
      // When
      await user.selectOptions($tabSwitchSelectElement, 'Control');
      // Then
      expect($tabSwitchSelectElement.value).toBe('Control');
    });

    test('should allow selecting Meta modifier', async () => {
      // When
      await user.selectOptions($tabSwitchSelectElement, 'Meta');
      // Then
      expect($tabSwitchSelectElement.value).toBe('Meta');
    });

    test('should have all valid modifier options available', () => {
      const options = Array.from($tabSwitchSelectElement.options).map(opt => opt.value);
      expect(options).toEqual(['', 'Alt', 'Command', 'Control', 'Meta']);
    });

    describe('description', () => {
      let $description;
      beforeEach(() => {
        $description = $tabSwitchContainer
          .querySelector('[data-testid=settings-keyboard-tab-switch-modifier-description]');
      });
      test('should exist', () => {
        expect($description).not.toBeNull();
      });
      test('should show default modifier in description when empty', () => {
        // Then
        expect($description.textContent).toContain('Control+1-9 to switch to specific tab');
      });
      test('should update description with current modifier', async () => {
        // When
        await user.selectOptions($tabSwitchSelectElement, 'Command');
        // Then
        await waitFor(() => expect($description.textContent).toContain('Command+1-9 to switch to specific tab'));
      });
    });
  });

  describe('Tab Traverse Modifier', () => {
    let $tabTraverseContainer;
    let $tabTraverseSelect;
    let $tabTraverseSelectElement;
    beforeEach(async () => {
      $tabTraverseContainer = await findByTestId(document, 'settings-keyboard-tab-traverse-modifier');
      $tabTraverseSelect = $tabTraverseContainer.querySelector('.material3.select');
      $tabTraverseSelectElement = $tabTraverseSelect.querySelector('select');
    });

    test('should display empty value by default', () => {
      expect($tabTraverseSelectElement.value).toBe('');
    });

    test('should allow selecting Alt modifier', async () => {
      // When
      await user.selectOptions($tabTraverseSelectElement, 'Alt');
      // Then
      expect($tabTraverseSelectElement.value).toBe('Alt');
    });

    test('should allow selecting Meta modifier', async () => {
      // When
      await user.selectOptions($tabTraverseSelectElement, 'Meta');
      // Then
      expect($tabTraverseSelectElement.value).toBe('Meta');
    });

    test('should allow selecting Control modifier', async () => {
      // When
      await user.selectOptions($tabTraverseSelectElement, 'Control');
      // Then
      expect($tabTraverseSelectElement.value).toBe('Control');
    });

    test('should allow selecting Command modifier', async () => {
      // When
      await user.selectOptions($tabTraverseSelectElement, 'Command');
      // Then
      expect($tabTraverseSelectElement.value).toBe('Command');
    });

    test('should have all valid modifier options available', () => {
      const options = Array.from($tabTraverseSelectElement.options).map(opt => opt.value);
      expect(options).toEqual(['', 'Alt', 'Command', 'Control', 'Meta']);
    });

    describe('description', () => {
      let $description;
      beforeEach(() => {
        $description = $tabTraverseContainer
          .querySelector('[data-testid=settings-keyboard-tab-traverse-modifier-description]');
      });
      test('should exist', () => {
        expect($description).not.toBeNull();
      });
      test('should show default modifier in description when empty', () => {
        // Then
        expect($description.textContent).toContain('Control+Tab');
      });
      test('should update description with current modifier', async () => {
        // When
        await user.selectOptions($tabTraverseSelectElement, 'Command');
        // Then
        await waitFor(() => expect($description.textContent).toContain('Command+Tab'));
      });
    });
  });

  describe('Component structure', () => {
    test('should render keyboard shortcuts title', () => {
      // Given
      const $title = document.querySelector('h2.title');
      // Then
      expect($title.textContent).toMatch(/Keyboard Shortcuts$/);
    });

    test('should render tab switch section', async () => {
      // Given
      const $tabSwitchTitle = await findByTestId(document, 'settings-keyboard-tab-switch-modifier-title');
      // Then
      expect($tabSwitchTitle.textContent).toBe('Tab Switch');
    });

    test('should render tab traverse section', async () => {
      // Given
      const $tabTraverseTitle = await findByTestId(document, 'settings-keyboard-tab-traverse-modifier-title');
      // Then
      expect($tabTraverseTitle.textContent).toBe('Tab Traverse');
    });
  });
});
