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
describe('Browser Spell Check test suite', () => {
  let mockIpcRenderer;
  let browserSpellCheck;
  beforeEach(() => {
    global.APP_EVENTS = {
      dictionaryGetMisspelled: 'dictionaryGetMisspelled'
    };
    mockIpcRenderer = {
      invoke: jest.fn()
    };
    jest.resetModules();
    jest.mock('electron', () => ({
      ipcRenderer: mockIpcRenderer
    }));
    browserSpellCheck = require('../preload.spell-check');
  });
  test('initSpellChecker, should set spell checker in provided webFrame', async () => {
    // Given
    const callback = jest.fn();
    Object.defineProperty(navigator, 'language', {value: 'eo'});
    const webFrame = {
      setSpellCheckProvider: jest.fn()
    };
    browserSpellCheck.initSpellChecker(webFrame);
    // When
    await webFrame.setSpellCheckProvider.mock.calls[0][1].spellCheck([], callback);
    // Then
    expect(webFrame.setSpellCheckProvider).toHaveBeenCalledTimes(1);
    expect(webFrame.setSpellCheckProvider).toHaveBeenCalledWith('eo', expect.any(Object));
    expect(mockIpcRenderer.invoke).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
