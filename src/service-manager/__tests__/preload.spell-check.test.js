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
  let idleCallbacks;
  let idleCallbackOptions;
  const runIdleCallbacks = () => {
    for (const idleCallback of idleCallbacks.splice(0)) {
      idleCallback();
    }
  };
  beforeEach(async () => {
    jest.resetModules();
    globalThis.APP_EVENTS = require('../../constants').APP_EVENTS;
    // jsdom has no requestIdleCallback: queue the callbacks so each test decides when the renderer is idle
    idleCallbacks = [];
    idleCallbackOptions = [];
    globalThis.requestIdleCallback = (idleCallback, options) => {
      idleCallbacks.push(idleCallback);
      idleCallbackOptions.push(options);
    };
    electron = require('../../__tests__').testElectron();
    settings = await require('../../__tests__').testSettings();
    electron.ipcMain.on('settingsLoad', settings.loadSettings);
    browserSpellCheck = require('../preload.spell-check');
    // Set the browser language to Esperanto
    Object.defineProperty(navigator, 'language', {value: 'eo'});
  });
  afterEach(() => {
    delete globalThis.requestIdleCallback;
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
  describe('spellCheck', () => {
    let dictionaryGetMisspelled;
    let spellCheck;
    beforeEach(async () => {
      dictionaryGetMisspelled = jest.fn(async words => words.filter(word => word.startsWith('mis')));
      electron.ipcMain.handle('dictionaryGetMisspelled', dictionaryGetMisspelled);
      browserSpellCheck.initSpellChecker();
      await waitFor(() => expect(electron.webFrame.setSpellCheckProvider).toHaveBeenCalledTimes(1));
      ({spellCheck} = electron.webFrame.spellCheckProviders.eo);
    });
    describe('with a single request', () => {
      let callback;
      beforeEach(async () => {
        callback = jest.fn();
        spellCheck(['correct', 'misspelled'], callback);
        await waitFor(() => expect(idleCallbacks).toHaveLength(1));
      });
      test('sends the words to the dictionary', () => {
        expect(dictionaryGetMisspelled).toHaveBeenCalledWith(['correct', 'misspelled']);
      });
      test('does not answer before the renderer is idle', () => {
        expect(callback).not.toHaveBeenCalled();
      });
      // A timed-out idle callback runs as a regular task, which could beat Electron's hand-over of a
      // newer request and answer a superseded one
      test('waits for the renderer to be idle without a timeout', () => {
        expect(idleCallbackOptions[0]?.timeout).toBeUndefined();
      });
      test('answers with the misspelled words once the renderer is idle', () => {
        runIdleCallbacks();
        expect(callback).toHaveBeenCalledExactlyOnceWith(['misspelled']);
      });
    });
    // Answering a superseded request crashes the renderer: Electron completes the newer request with
    // it, and the newer request's own answer then finds nothing pending
    describe('with a request superseded while its dictionary lookup is in flight', () => {
      let supersededCallback;
      let newerCallback;
      beforeEach(async () => {
        let resolveSuperseded;
        dictionaryGetMisspelled.mockImplementationOnce(() => new Promise(resolve => {
          resolveSuperseded = resolve;
        }));
        supersededCallback = jest.fn();
        newerCallback = jest.fn();
        spellCheck(['misspelled'], supersededCallback);
        spellCheck(['correct', 'mistake'], newerCallback);
        await waitFor(() => expect(idleCallbacks).toHaveLength(1));
        resolveSuperseded(['misspelled']);
        await waitFor(() => expect(idleCallbacks).toHaveLength(2));
        runIdleCallbacks();
      });
      test('never answers the superseded request', () => {
        expect(supersededCallback).not.toHaveBeenCalled();
      });
      test('answers the newer request', () => {
        expect(newerCallback).toHaveBeenCalledExactlyOnceWith(['mistake']);
      });
    });
    // Electron posts a task to hand a request over, so Blink may have issued a newer request while the
    // answer to the previous one is waiting for the renderer to be idle
    describe('with a request superseded while its answer waits for the renderer to be idle', () => {
      let supersededCallback;
      let newerCallback;
      beforeEach(async () => {
        supersededCallback = jest.fn();
        newerCallback = jest.fn();
        spellCheck(['misspelled'], supersededCallback);
        await waitFor(() => expect(idleCallbacks).toHaveLength(1));
        spellCheck(['correct', 'mistake'], newerCallback);
        await waitFor(() => expect(idleCallbacks).toHaveLength(2));
        runIdleCallbacks();
      });
      test('never answers the superseded request', () => {
        expect(supersededCallback).not.toHaveBeenCalled();
      });
      test('answers the newer request', () => {
        expect(newerCallback).toHaveBeenCalledExactlyOnceWith(['mistake']);
      });
    });
    describe('with a dictionary that fails', () => {
      let callback;
      beforeEach(async () => {
        dictionaryGetMisspelled.mockImplementation(async () => {
          throw new Error('Script failed to execute');
        });
        callback = jest.fn();
        spellCheck(['misspelled'], callback);
        await waitFor(() => expect(idleCallbacks).toHaveLength(1));
        runIdleCallbacks();
      });
      // Blink leaves the request pending forever if the callback never runs
      test('answers with nothing misspelled', () => {
        expect(callback).toHaveBeenCalledExactlyOnceWith([]);
      });
    });
    describe('with a callback that throws', () => {
      let consoleError;
      let callback;
      beforeEach(async () => {
        consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        callback = jest.fn(() => {
          throw new Error('Blink blew up');
        });
        spellCheck(['misspelled'], callback);
        await waitFor(() => expect(idleCallbacks).toHaveLength(1));
        runIdleCallbacks();
      });
      afterEach(() => {
        consoleError.mockRestore();
      });
      test('reports the error', () => {
        expect(consoleError).toHaveBeenCalledWith('Spell check callback failed', expect.any(Error));
      });
      test('answers the request only once', () => {
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });
  });
});
