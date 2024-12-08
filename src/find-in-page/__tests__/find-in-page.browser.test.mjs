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
import {jest} from '@jest/globals';
import {loadDOM} from '../../__tests__/index.mjs';
import {getByTestId, fireEvent, waitFor} from '@testing-library/dom';

describe('Find in Page :: in browser test suite', () => {
  let onFindInPageCallback;
  beforeEach(async () => {
    jest.resetModules();
    window.electron = {
      close: jest.fn(),
      findInPage: jest.fn(),
      onFindInPage: jest.fn(callback => {
        onFindInPageCallback = callback;
      })
    };
    await loadDOM({meta: import.meta, path: ['..', 'index.html']});
  });
  describe.each([
    {testId: 'find-previous', icon: '\ue316', title: 'Previous', expectedFunction: 'findInPage'},
    {testId: 'find-next', icon: '\ue313', title: 'Next', expectedFunction: 'findInPage'},
    {testId: 'close', icon: '\ue5cd', title: 'Close', expectedFunction: 'close'}
  ])('Has Icon button $testId entry', ({testId, icon, title, expectedFunction}) => {
    let $iconButton;
    beforeEach(() => {
      $iconButton = getByTestId(document, testId);
    });
    test(`should have icon ${icon}`, () => {
      expect($iconButton.textContent).toBe(icon);
    });
    test(`should have title ${icon}`, () => {
      expect($iconButton.getAttribute('title')).toBe(title);
    });
    test('click, should invoke function', () => {
      // When
      fireEvent.click($iconButton);
      // Then
      expect(window.electron[expectedFunction]).toHaveBeenCalledTimes(1);
    });
  });
  describe('Input field', () => {
    let $input;
    beforeEach(() => {
      $input = document.querySelector('.input-wrapper input');
    });
    test('should be focused', () => {
      expect(document.activeElement).toBe($input);
    });
    test('should call findInPage on Enter', () => {
      // Given
      $input.value = 'test';
      // When
      fireEvent.keyDown($input, {key: 'Enter'});
      // Then
      expect(window.electron.findInPage).toHaveBeenCalledTimes(1);
      expect(window.electron.findInPage).toHaveBeenCalledWith({text: 'test'});
    });
    test('should close on Escape', () => {
      // When
      fireEvent.keyDown($input, {key: 'Escape'});
      // Then
      expect(window.electron.close).toHaveBeenCalledTimes(1);
    });
    test('should not call findInPage on other keys', () => {
      // When
      fireEvent.keyDown($input, {key: 'a'});
      // Then
      expect(window.electron.findInPage).not.toHaveBeenCalled();
    });
  });
  describe('Results', () => {
    let $results;
    beforeEach(() => {
      $results = document.querySelector('.results');
    });
    test('should be hidden when no matches', () => {
      // Then
      expect($results.style.visibility).toBe('hidden');
    });
    test('should be visible when matches', async () => {
      // Given
      onFindInPageCallback(null, {matches: 1});
      // Then
      await waitFor(() => expect($results.style.visibility).toBe('visible'));
    });
    test('should show active match ordinal and total matches', async () => {
      // Given
      onFindInPageCallback(null, {matches: 2, activeMatchOrdinal: 1});
      // Then
      await waitFor(() => expect($results.textContent).toBe('1/2'));
    });
    test('should set focus on input', () => {
      expect(document.activeElement).toBe(document.querySelector('.input-wrapper input'));
    });
  });
});
