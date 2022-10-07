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
import {findByTestId} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import {ipcRenderer} from './settings.browser.mjs';

describe('Settings (Other) in Browser test suite', () => {
  let mockIpcRenderer;
  let user;
  beforeEach(async () => {
    jest.resetModules();
    mockIpcRenderer = ipcRenderer();
    await import('../../../bundles/settings.preload');
    window.ipcRenderer = mockIpcRenderer;
    await loadDOM({meta: import.meta, path: ['..', 'index.html']});
    user = userEvent.setup(document);
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
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('settingsSave', expect.objectContaining({
        theme: 'light'
      }));
    });
  });
  test('ElectronIM version is visible', async () => {
    const $electronimVersion = await findByTestId(document, 'settings-electronim-version');
    expect($electronimVersion.textContent).toBe('ElectronIM version 0.0.0');
  });
});
