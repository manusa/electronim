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
import {getByText, fireEvent, waitFor} from '@testing-library/dom';

describe('App Menu in Browser test suite', () => {
  beforeEach(async () => {
    jest.resetModules();
    window.electron = {
      close: jest.fn(),
      helpOpenDialog: jest.fn(),
      settingsOpenDialog: jest.fn()
    };
    await loadDOM({meta: import.meta, path: ['..', 'index.html']});
  });
  test('wrapper, click should close menu (BrowserView)', () => {
    // When
    fireEvent.click(document.querySelector('.app-menu .wrapper'));
    // Then
    expect(window.electron.close).toHaveBeenCalledTimes(1);
  });
  describe('Settings entry', () => {
    let settings;
    beforeEach(() => {
      settings = getByText(document, 'Settings');
    });
    test('should be visible', () => {
      expect(settings.getAttribute('class'))
        .toMatch(/^dropdown-item*/);
    });
    test('click, should open settings dialog', () => {
      // When
      fireEvent.click(settings);
      // Then
      expect(window.electron.settingsOpenDialog).toHaveBeenCalledTimes(1);
    });
    test('hover, should activate entry', async () => {
      // When
      fireEvent.mouseOver(settings);
      // Then
      await waitFor(() => expect(settings.getAttribute('class'))
        .toContain('is-active'));
    });
  });
  describe('Help entry', () => {
    test('should be visible', () => {
      expect(getByText(document, 'Help').getAttribute('class'))
        .toMatch(/^dropdown-item*/);
    });
    test('click, should open settings dialog', () => {
      // When
      fireEvent.click(getByText(document, 'Help'));
      // Then
      expect(window.electron.helpOpenDialog).toHaveBeenCalledTimes(1);
    });
  });
});

