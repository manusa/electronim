/*
   Copyright 2024 Marc Nuri San Felix

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
/**
 * @jest-environment jsdom
 */
import {beforeEach, describe, expect, test} from '@jest/globals';
import {mockElectron} from '../../__tests__';
import {settings} from '../../__tests__/settings.browser.mjs';

describe('Settings Keyboard Shortcuts Pane Browser test suite', () => {
  beforeEach(() => {
    mockElectron();
    settings();
  });
  test('Should render keyboard shortcuts pane', () => {
    // When
    const result = document.querySelector('.settings');
    // Then
    expect(result).not.toBeNull();
  });
  describe('Keyboard shortcuts tab interaction', () => {
    test('Should activate keyboard pane when clicked', async () => {
      // When
      const keyboardButton = document.querySelector('.navigation-rail__button:nth-child(3)');
      expect(keyboardButton.textContent).toContain('Keyboard');
      keyboardButton.click();
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait for render
      // Then
      const keyboardPane = document.querySelector('.settings__keyboard');
      expect(keyboardPane).not.toBeNull();
      expect(document.querySelector('.title').textContent).toBe('Keyboard Shortcuts');
    });
  });
  describe('Keyboard settings form', () => {
    test('Should display default keyboard shortcut settings', async () => {
      // Given
      const keyboardButton = document.querySelector('.navigation-rail__button:nth-child(3)');
      keyboardButton.click();
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait for render
      // When
      const tabSwitchField = document.querySelector('input[placeholder="Ctrl (default)"]');
      const tabTraverseField = document.querySelectorAll('input[placeholder="Ctrl (default)"]')[1];
      // Then
      expect(tabSwitchField).not.toBeNull();
      expect(tabTraverseField).not.toBeNull();
      expect(tabSwitchField.value).toBe('');
      expect(tabTraverseField.value).toBe('');
    });
    test('Should update tab switch modifier', async () => {
      // Given
      const keyboardButton = document.querySelector('.navigation-rail__button:nth-child(3)');
      keyboardButton.click();
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait for render
      const tabSwitchField = document.querySelector('input[placeholder="Ctrl (default)"]');
      // When
      tabSwitchField.value = 'Alt';
      tabSwitchField.dispatchEvent(new Event('input', {bubbles: true}));
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait for state update
      // Then
      expect(tabSwitchField.value).toBe('Alt');
    });
    test('Should validate keyboard shortcuts', async () => {
      // Given
      const keyboardButton = document.querySelector('.navigation-rail__button:nth-child(3)');
      keyboardButton.click();
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait for render
      const tabSwitchField = document.querySelector('input[placeholder="Ctrl (default)"]');
      // When
      tabSwitchField.value = 'InvalidKey';
      tabSwitchField.dispatchEvent(new Event('input', {bubbles: true}));
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait for state update
      // Then
      const fieldContainer = tabSwitchField.closest('.text-field');
      expect(fieldContainer.classList).toContain('text-field--error');
    });
  });
});
