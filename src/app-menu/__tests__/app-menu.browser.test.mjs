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
import {getByTestId, fireEvent} from '@testing-library/dom';

describe('App Menu in Browser test suite', () => {
  let electron;
  beforeEach(async () => {
    jest.resetModules();
    electron = await (await import('../../__tests__/electron.mjs')).testElectron();
    await import('../../../bundles/app-menu.preload');
    await loadDOM({meta: import.meta, path: ['..', 'index.html']});
  });
  test('wrapper, click should close menu (WebContentsView)', () => {
    // Given
    const appMenuClose = jest.fn();
    electron.ipcMain.once('appMenuClose', appMenuClose);
    // When
    fireEvent.click(document.querySelector('.app-menu .wrapper'));
    // Then
    expect(appMenuClose).toHaveBeenCalledTimes(1);
  });
  describe.each([
    {testId: 'about', icon: '\ue88e', label: 'About', expectedFunction: 'aboutOpenDialog'},
    {testId: 'help', icon: '\ue887', label: 'Help', expectedFunction: 'helpOpenDialog'},
    {testId: 'quit', icon: '\ue5cd', label: 'Quit', expectedFunction: 'quit'},
    {testId: 'settings', icon: '\ue8b8', label: 'Settings', expectedFunction: 'settingsOpenDialog'}
  ])('$label entry', ({testId, icon, label, expectedFunction}) => {
    let entry;
    beforeEach(() => {
      entry = getByTestId(document, `${testId}-menu-entry`);
    });
    test('should be visible', () => {
      expect(entry.getAttribute('class'))
        .toMatch(/^menu-item*/);
      expect(entry.querySelector('.menu-item__text').textContent).toBe(label);
    });
    test(`should have icon ${icon}`, () => {
      expect(entry.querySelector('.menu-item__leading-icon').textContent).toBe(icon);
    });
    test('click, should invoke function', () => {
      // Given
      const listener = jest.fn();
      electron.ipcMain.once(expectedFunction, listener);
      // When
      fireEvent.click(entry);
      // Then
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});

