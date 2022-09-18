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
/* eslint-disable no-console */
const {waitFor} = require('@testing-library/dom');

describe('Tab Manager Module preload test suite', () => {
  let mockElectron;
  beforeEach(() => {
    mockElectron = {
      webFrame: {setSpellCheckProvider: jest.fn()},
      ipcRenderer: {invoke: async () => ({useNativeSpellChecker: false})}
    };
    jest.resetModules();
    jest.mock('electron', () => mockElectron);
    window.APP_EVENTS = require('../../constants').APP_EVENTS;
    window.ELECTRONIM_VERSION = '1.33.7';
    window.Notification = 'NOT A FUNCTION';
    window.navigator.mediaDevices = {getDisplayMedia: 'NOT A FUNCTION'};
  });
  describe('preload', () => {
    beforeEach(() => {
      jest.spyOn(require('../preload.keyboard-shortcuts'), 'initKeyboardShortcuts');
      jest.spyOn(require('../preload.spell-check'), 'initSpellChecker');
    });
    test('adds required libraries', async () => {
      // When
      require('../preload');
      // Then
      expect(window.Notification).toEqual(expect.any(Function));
      expect(window.navigator.mediaDevices.getDisplayMedia).toEqual(expect.any(Function));
      expect(require('../preload.keyboard-shortcuts').initKeyboardShortcuts).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(mockElectron.webFrame.setSpellCheckProvider).toHaveBeenCalledTimes(1));
      expect(require('../preload.spell-check').initSpellChecker).toHaveBeenCalledTimes(1);
    });
    test('logs error if can\'t initialize spell checker', async () => {
      // Given
      jest.mock('../preload.spell-check', () => ({
        initSpellChecker: async () => {
          throw new Error('Error initializing spell checker');
        }
      }));
      jest.spyOn(console, 'error').mockImplementationOnce(() => {});
      // When
      require('../preload');
      // Then
      await waitFor(() => expect(console.error).toHaveBeenCalledTimes(1));
      expect(console.error).toHaveBeenCalledWith('Error initializing spell check', expect.any(Error));
    });
  });
  describe('preload.bundle', () => {
    beforeEach(() => {
      window.addEventListener = jest.fn();
    });
    test('adds required libraries', async () => {
      // When
      require('../../../bundles/tab-manager.preload');
      // Then
      expect(window.Notification).toEqual(expect.any(Function));
      expect(window.navigator.mediaDevices.getDisplayMedia).toEqual(expect.any(Function));
      await waitFor(() => expect(mockElectron.webFrame.setSpellCheckProvider).toHaveBeenCalledTimes(1));
      expect(window.addEventListener).toHaveBeenCalledTimes(2);
      expect(window.addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('load', expect.any(Function));
    });
  });
});
