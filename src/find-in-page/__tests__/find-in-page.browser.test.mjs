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
  let electron;
  beforeEach(async () => {
    jest.resetModules();
    electron = await (await import('../../__tests__/electron.mjs')).testElectron();
    await import('../../../bundles/find-in-page.preload');
    await loadDOM({meta: import.meta, path: ['..', 'index.html']});
    // Simulate webcontents ready
    electron.ipcRenderer.emit('findInPageReady');
  });
  describe.each([
    {testId: 'find-previous', icon: '\ue316', title: 'Previous', expectedEvent: 'findInPage'},
    {testId: 'find-next', icon: '\ue313', title: 'Next', expectedEvent: 'findInPage'},
    {testId: 'close', icon: '\ue5cd', title: 'Close', expectedEvent: 'findInPageClose'}
  ])('Has Icon button $testId entry', ({testId, icon, title, expectedEvent}) => {
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
    test(`click, should send ${expectedEvent} to ipcMain`, () => {
      // Given
      const listener = jest.fn();
      electron.ipcMain.once(expectedEvent, listener);
      // When
      fireEvent.click($iconButton);
      // Then
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
  describe('Input field', () => {
    let findInPage;
    let findInPageClose;
    let $input;
    beforeEach(() => {
      findInPage = jest.fn();
      electron.ipcMain.on('findInPage', findInPage);
      findInPageClose = jest.fn();
      electron.ipcMain.on('findInPageClose', findInPageClose);
      $input = document.querySelector('.input-wrapper input');
    });
    test('should be focused', async () => {
      await waitFor(() => expect(document.activeElement).toBe($input));
    });
    test('should call findInPage on Enter', () => {
      // Given
      $input.value = 'test';
      // When
      fireEvent.keyDown($input, {key: 'Enter'});
      // Then
      expect(findInPage).toHaveBeenCalledTimes(1);
      expect(findInPage).toHaveBeenCalledWith({text: 'test'});
    });
    test('should close on Escape', () => {
      // When
      fireEvent.keyDown($input, {key: 'Escape'});
      // Then
      expect(findInPageClose).toHaveBeenCalledTimes(1);
    });
    test('should not call findInPage on other keys', () => {
      // When
      fireEvent.keyDown($input, {key: 'a'});
      // Then
      expect(findInPage).not.toHaveBeenCalled();
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
      electron.ipcRenderer.emit('findInPageFound', null, {matches: 1});
      // Then
      await waitFor(() => expect($results.style.visibility).toBe('visible'));
    });
    test('should show active match ordinal and total matches', async () => {
      // Given
      electron.ipcRenderer.emit('findInPageFound', null, {matches: 2, activeMatchOrdinal: 1});
      // Then
      await waitFor(() => expect($results.textContent).toBe('1/2'));
    });
    test('should set focus on input', async () => {
      await waitFor(() => expect(document.activeElement).toBe(document.querySelector('.input-wrapper input')));
    });
  });
});
