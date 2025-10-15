/*
   Copyright 2019 Marc Nuri San Felix

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
const {waitFor} = require('@testing-library/dom');

describe('Browser Spell Check test suite', () => {
  let electron;
  let settings;
  let browserSpellCheck;
  beforeEach(async () => {
    jest.resetModules();
    globalThis.APP_EVENTS = require('../../constants').APP_EVENTS;
    electron = require('../../__tests__').testElectron();
    settings = await require('../../__tests__').testSettings();
    electron.ipcMain.on('settingsLoad', settings.loadSettings);
    browserSpellCheck = require('../preload.spell-check');
    // Set the browser language to Esperanto
    Object.defineProperty(navigator, 'language', {value: 'eo'});
  });
  describe('initSpellChecker', () => {
    test('not-native, should load settings and set SpellCheckProvider in webFrame for navigator language', async () => {
      // Given
      settings.updateSettings({useNativeSpellChecker: false});
      // When
      browserSpellCheck.initSpellChecker();
      // Then
      await waitFor(() => expect(electron.webFrame.setSpellCheckProvider).toHaveBeenCalledTimes(1));
      expect(electron.webFrame.setSpellCheckProvider).toHaveBeenCalledWith('eo', expect.any(Object));
    });
    test('native, should load settings and skip processing', async () => {
      // Given
      settings.updateSettings({useNativeSpellChecker: true});
      // When
      await browserSpellCheck.initSpellChecker();
      // Then
      expect(electron.webFrame.setSpellCheckProvider).not.toHaveBeenCalled();
    });
    test('retries in case of failure', async () => {
      // Given
      electron.ipcRenderer.invoke = jest.fn()
        .mockImplementationOnce(async () => {
          throw new Error('failed');
        })
        .mockImplementationOnce(async () => ({useNativeSpellChecker: false}));
      // When
      browserSpellCheck.initSpellChecker();
      // Then
      await waitFor(() => expect(electron.webFrame.setSpellCheckProvider).toHaveBeenCalledTimes(1));
      expect(electron.ipcRenderer.invoke).toHaveBeenCalledTimes(2);
      expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith('settingsLoad');
    });
  });
  test('spellCheck, should invoke dictionaryGetMisspelled and trigger callback', async () => {
    // Given
    const dictionaryGetMisspelled = jest.fn();
    electron.ipcMain.on('dictionaryGetMisspelled', dictionaryGetMisspelled);
    browserSpellCheck.initSpellChecker();
    await waitFor(() => expect(electron.webFrame.setSpellCheckProvider).toHaveBeenCalledTimes(1));
    const spellCheckCallback = jest.fn();
    // When
    await electron.webFrame.spellCheckProviders.eo.spellCheck([], spellCheckCallback);
    // Then
    expect(dictionaryGetMisspelled).toHaveBeenCalledWith([]);
    expect(spellCheckCallback).toHaveBeenCalledTimes(1);
  });
});
