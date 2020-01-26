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
describe('Browser Keyboard Shortcuts test suite', () => {
  let mockIpcRenderer;
  let browserKeyboardShortcuts;
  beforeEach(() => {
    global.APP_EVENTS = {
      reload: 'reload'
    };
    mockIpcRenderer = {
      send: jest.fn()
    };
    jest.resetModules();
    jest.mock('electron', () => ({
      ipcRenderer: mockIpcRenderer
    }));
    browserKeyboardShortcuts = require('../browser-keyboard-shortcuts');
  });
  test('initKeyboardShortcuts should add window event listener', () => {
    // Given
    jest.spyOn(window, 'addEventListener');
    // When
    browserKeyboardShortcuts.initKeyboardShortcuts();
    // Then
    expect(window.addEventListener).toHaveBeenCalledTimes(1);
    expect(window.addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
  });
  describe('Events with NO key modifier', () => {
    test('F5, should send reload app event', () => {
      // Given
      browserKeyboardShortcuts.initKeyboardShortcuts();
      // When
      window.dispatchEvent(new KeyboardEvent('keyup', {key: 'F5'}));
      // Then
      expect(mockIpcRenderer.send).toHaveBeenCalledTimes(1);
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('reload');
    });
  });
  describe('Control modified events', () => {
    test('ctrl+unrecognized_key, should NOT send any app event', () => {
      // Given
      browserKeyboardShortcuts.initKeyboardShortcuts();
      // When
      window.dispatchEvent(new KeyboardEvent('keyup', {key: 'NONEXISTENT', ctrlKey: true}));
      // Then
      expect(mockIpcRenderer.send).not.toHaveBeenCalled();
    });
    test('ctrl+r, should send reload app event', () => {
      // Given
      browserKeyboardShortcuts.initKeyboardShortcuts();
      // When
      window.dispatchEvent(new KeyboardEvent('keyup', {key: 'r', ctrlKey: true}));
      // Then
      expect(mockIpcRenderer.send).toHaveBeenCalledTimes(1);
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('reload');
    });
  });
  describe('Command modified events', () => {
    test('cmd+R, should send reload app event', () => {
      // Given
      browserKeyboardShortcuts.initKeyboardShortcuts();
      // When
      window.dispatchEvent(new KeyboardEvent('keyup', {key: 'R', metaKey: true}));
      // Then
      expect(mockIpcRenderer.send).toHaveBeenCalledTimes(1);
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('reload');
    });
  });
});
