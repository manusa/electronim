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
import {fireEvent} from '@testing-library/dom';

describe('About in Browser test suite', () => {
  beforeEach(async () => {
    jest.resetModules();
    window.electron = {
      close: jest.fn(),
      versions: {electron: '1.33.7', chrome: '1337', node: '42', v8: '13.37'}
    };
    await loadDOM({meta: import.meta, path: ['..', 'index.html']});
  });
  test('close, click should close dialog', () => {
    // When
    fireEvent.click(document.querySelector('.top-app-bar .leading-navigation-icon'));
    // Then
    expect(window.electron.close).toHaveBeenCalledTimes(1);
  });
  test.each([
    {label: 'Electron', expectedVersion: '1.33.7'},
    {label: 'Chromium', expectedVersion: '1337'},
    {label: 'Node', expectedVersion: '42'},
    {label: 'V8', expectedVersion: '13.37'}
  ])('Should display $label with version $expectedVersion', ({label, expectedVersion}) => {
    const versions = Array.from(document.querySelectorAll('.about-content__version'))
      .map(v => ({
        label: v.querySelector('.version__component').textContent,
        version: v.querySelector('.version__value').textContent
      }));
    expect(versions).toContainEqual({label, version: expectedVersion});
  });
  test('Shows an icon with ElectronIM logo', () => {
    expect(document.querySelector('.about-content .card__image svg.electronim-logo'))
      .not.toBeNull();
  });
});

