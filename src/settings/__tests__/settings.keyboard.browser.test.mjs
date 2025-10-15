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
    let $tabSwitchTextField;
    let $tabSwitchInput;
    beforeEach(async () => {
      $tabSwitchContainer = await findByTestId(document, 'settings-keyboard-tab-switch-modifier');
      $tabSwitchTextField = $tabSwitchContainer.querySelector('.material3.text-field');
      $tabSwitchInput = $tabSwitchTextField.querySelector('input');
    });

    test('should display empty value by default', () => {
      expect($tabSwitchInput.value).toBe('');
    });

    test('should accept valid modifier key', async () => {
      // When
      await user.clear($tabSwitchInput);
      await user.type($tabSwitchInput, 'Alt');
      // Then
      expect($tabSwitchInput.value).toBe('Alt');
    });

    test('should not show errored for valid modifier', async () => {
      // When
      await user.clear($tabSwitchInput);
      await user.type($tabSwitchInput, 'Ctrl');
      // Then
      expect($tabSwitchTextField.classList.contains('errored')).toBe(false);
    });

    test('should show errored for invalid modifier', async () => {
      // When
      await user.clear($tabSwitchInput);
      await user.type($tabSwitchInput, 'InvalidKey');
      // Then
      await waitFor(() => expect($tabSwitchTextField.classList.contains('errored')).toBe(true));
    });

    test('should not show errored for empty value', async () => {
      // When
      await user.clear($tabSwitchInput);
      // Then
      expect($tabSwitchTextField.classList.contains('errored')).toBe(false);
    });

    test('should accept case insensitive modifiers', async () => {
      // When
      await user.clear($tabSwitchInput);
      await user.type($tabSwitchInput, 'alt');
      // Then
      expect($tabSwitchTextField.classList.contains('errored')).toBe(false);
    });

    test('should handle whitespace in input', async () => {
      // When
      await user.clear($tabSwitchInput);
      await user.type($tabSwitchInput, '  Ctrl  ');
      // Then
      expect($tabSwitchTextField.classList.contains('errored')).toBe(false);
    });

    test('should reject partial modifier matches', async () => {
      // When
      await user.clear($tabSwitchInput);
      await user.type($tabSwitchInput, 'Ct');
      // Then
      await waitFor(() => expect($tabSwitchTextField.classList.contains('errored')).toBe(true));
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
        expect($description.textContent).toContain('Ctrl+1-9 to switch to specific tab');
      });
      test('should update description with current modifier', async () => {
        // When
        await user.clear($tabSwitchInput);
        await user.type($tabSwitchInput, 'Command');
        // Then
        await waitFor(() => expect($description.textContent).toContain('Command+1-9 to switch to specific tab'));
      });
    });
  });

  describe('Tab Traverse Modifier', () => {
    let $tabTraverseContainer;
    let $tabTraversTextField;
    let $tabTraverseInput;
    beforeEach(async () => {
      $tabTraverseContainer = await findByTestId(document, 'settings-keyboard-tab-traverse-modifier');
      $tabTraversTextField = $tabTraverseContainer.querySelector('.material3.text-field');
      $tabTraverseInput = $tabTraversTextField.querySelector('input');
    });

    test('should display empty value by default', () => {
      expect($tabTraverseInput.value).toBe('');
    });

    test('should accept valid modifier key', async () => {
      // When
      await user.clear($tabTraverseInput);
      await user.type($tabTraverseInput, 'Meta');
      // Then
      expect($tabTraverseInput.value).toBe('Meta');
    });

    test('should not show errored for valid modifier', async () => {
      // When
      await user.clear($tabTraverseInput);
      await user.type($tabTraverseInput, 'Control');
      // Then
      expect($tabTraversTextField.classList.contains('errored')).toBe(false);
    });

    test('should show errored for invalid modifier', async () => {
      // When
      await user.clear($tabTraverseInput);
      await user.type($tabTraverseInput, 'InvalidKey');
      // Then
      await waitFor(() => expect($tabTraversTextField.classList.contains('errored')).toBe(true));
    });

    test('should not show errored for empty value', async () => {
      // When
      await user.clear($tabTraverseInput);
      // Then
      expect($tabTraversTextField.classList.contains('errored')).toBe(false);
    });

    test('should accept case insensitive modifiers', async () => {
      // When
      await user.clear($tabTraverseInput);
      await user.type($tabTraverseInput, 'alt');
      // Then
      expect($tabTraversTextField.classList.contains('errored')).toBe(false);
    });

    test('should handle whitespace in input', async () => {
      // When
      await user.clear($tabTraverseInput);
      await user.type($tabTraverseInput, '  Ctrl  ');
      // Then
      expect($tabTraversTextField.classList.contains('errored')).toBe(false);
    });

    test('should reject partial modifier matches', async () => {
      // When
      await user.clear($tabTraverseInput);
      await user.type($tabTraverseInput, 'Ct');
      // Then
      await waitFor(() => expect($tabTraversTextField.classList.contains('errored')).toBe(true));
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
        expect($description.textContent).toContain('Ctrl+Tab');
      });
      test('should update description with current modifier', async () => {
        // When
        await user.clear($tabTraverseInput);
        await user.type($tabTraverseInput, 'Command');
        // Then
        await waitFor(() => expect($description.textContent).toContain('Command+Tab'));
      });
    });
  });

  describe('Modifier validation', () => {
    describe.each([
      {testId: 'settings-keyboard-tab-switch-modifier', section: 'Tab Switch'},
      {testId: 'settings-keyboard-tab-traverse-modifier', section: 'Tab Traverse'}
    ])('$section modifier validation', ({testId}) => {
      let $container;
      let $textField;
      let $input;

      beforeEach(async () => {
        $container = await findByTestId(document, testId);
        $textField = $container.querySelector('.material3.text-field');
        $input = $textField.querySelector('input');
      });

      test('should be valid for empty input', async () => {
        await user.clear($input);
        expect($textField.classList.contains('errored')).toBe(false);
      });
      test.each([
        'Alt', 'Command', 'Control', 'Ctrl', 'Meta',
        'alt', 'command', 'control', 'ctrl', 'meta',
        'ALT', 'COMMAND', 'CONTROL', 'CTRL', 'META',
        '  ', '  Ctrl  ', '  Alt  '
      ])('should be valid for %s', async modifier => {
        await user.clear($input);
        await user.type($input, modifier);
        expect($textField.classList.contains('errored')).toBe(false);
      });
      test.each([
        'InvalidKey', 'Space', 'Enter', 'Tab', 'Shift', 'shift', 'SHIFT',
        'Ct', 'Al', 'Comman', '123',
        'Ctrl+Alt', 'Alt+Tab'
      ])('should be invalid for %s', async modifier => {
        await user.clear($input);
        await user.type($input, modifier);
        await waitFor(() => expect($textField.classList.contains('errored')).toBe(true));
      });
    });
  });

  test('Should display list of valid modifiers', async () => {
    // Given
    const $validModifiers = await findByTestId(document, 'settings-keyboard-valid-modifiers');
    // Then
    expect($validModifiers.textContent).toContain('Valid modifiers: Alt, Ctrl, Meta, Control, Command');
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
