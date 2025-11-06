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
  let electron;
  let browserKeyboardShortcuts;
  beforeEach(() => {
    jest.resetModules();
    globalThis.APP_EVENTS = require('../../constants').APP_EVENTS;
    electron = require('../../__tests__').testElectron();
    browserKeyboardShortcuts = require('../preload.keyboard-shortcuts');
  });
  test('initKeyboardShortcuts should add window event listeners', () => {
    // Given
    jest.spyOn(globalThis, 'addEventListener');
    // When
    browserKeyboardShortcuts.initKeyboardShortcuts();
    // Then
    expect(globalThis.addEventListener).toHaveBeenCalledTimes(2);
    expect(globalThis.addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
    expect(globalThis.addEventListener).toHaveBeenCalledWith('load', expect.any(Function));
  });
  describe('Events with NO key modifier', () => {
    test('F5, should send reload app event', () => {
      // Given
      browserKeyboardShortcuts.initKeyboardShortcuts();
      // When
      globalThis.dispatchEvent(new KeyboardEvent('keyup', {key: 'F5'}));
      // Then
      expect(electron.ipcRenderer.send).toHaveBeenCalledTimes(1);
      expect(electron.ipcRenderer.send).toHaveBeenCalledWith('reload');
    });
  });
  describe('Control modified events', () => {
    test('ctrl+R, should send reload app event', () => {
      // Given
      browserKeyboardShortcuts.initKeyboardShortcuts();
      // When
      globalThis.dispatchEvent(new KeyboardEvent('keyup', {key: 'R', ctrlKey: true}));
      // Then
      expect(electron.ipcRenderer.send).toHaveBeenCalledTimes(1);
      expect(electron.ipcRenderer.send).toHaveBeenCalledWith('reload');
    });
    test('ctrl+r (lowercase), should send reload app event', () => {
      // Given
      browserKeyboardShortcuts.initKeyboardShortcuts();
      // When
      globalThis.dispatchEvent(new KeyboardEvent('keyup', {key: 'r', ctrlKey: true}));
      // Then
      expect(electron.ipcRenderer.send).toHaveBeenCalledTimes(1);
      expect(electron.ipcRenderer.send).toHaveBeenCalledWith('reload');
    });
    test('ctrl++ (zoom in), should send zoomIn event', () => {
      // Given
      browserKeyboardShortcuts.initKeyboardShortcuts();
      // When
      globalThis.dispatchEvent(new KeyboardEvent('keyup', {key: '+', ctrlKey: true}));
      // Then
      expect(electron.ipcRenderer.send).toHaveBeenCalledTimes(1);
      expect(electron.ipcRenderer.send).toHaveBeenCalledWith('zoomIn');
    });
    test('ctrl+- (zoom out), should send zoomOut event', () => {
      // Given
      browserKeyboardShortcuts.initKeyboardShortcuts();
      // When
      globalThis.dispatchEvent(new KeyboardEvent('keyup', {key: '-', ctrlKey: true}));
      // Then
      expect(electron.ipcRenderer.send).toHaveBeenCalledTimes(1);
      expect(electron.ipcRenderer.send).toHaveBeenCalledWith('zoomOut');
    });
    test('ctrl+0 (zoom reset), should send zoomReset event', () => {
      // Given
      browserKeyboardShortcuts.initKeyboardShortcuts();
      // When
      globalThis.dispatchEvent(new KeyboardEvent('keyup', {key: '0', ctrlKey: true}));
      // Then
      expect(electron.ipcRenderer.send).toHaveBeenCalledTimes(1);
      expect(electron.ipcRenderer.send).toHaveBeenCalledWith('zoomReset');
    });
    test('ctrl+unrecognized_key, should NOT send any app event', () => {
      // Given
      browserKeyboardShortcuts.initKeyboardShortcuts();
      // When
      globalThis.dispatchEvent(new KeyboardEvent('keyup', {key: 'NONEXISTENT', ctrlKey: true}));
      // Then
      expect(electron.ipcRenderer.send).not.toHaveBeenCalled();
    });
  });
  describe('Command modified events', () => {
    test('cmd+R, should send reload app event', () => {
      // Given
      browserKeyboardShortcuts.initKeyboardShortcuts();
      // When
      globalThis.dispatchEvent(new KeyboardEvent('keyup', {key: 'R', metaKey: true}));
      // Then
      expect(electron.ipcRenderer.send).toHaveBeenCalledTimes(1);
      expect(electron.ipcRenderer.send).toHaveBeenCalledWith('reload');
    });
    test('cmd+r (lowercase), should send reload app event', () => {
      // Given
      browserKeyboardShortcuts.initKeyboardShortcuts();
      // When
      globalThis.dispatchEvent(new KeyboardEvent('keyup', {key: 'r', metaKey: true}));
      // Then
      expect(electron.ipcRenderer.send).toHaveBeenCalledTimes(1);
      expect(electron.ipcRenderer.send).toHaveBeenCalledWith('reload');
    });
  });
  describe('Mouse wheel events', () => {
    test('ctrl+scrollUp, should send zoomIn event', () => {
      // Given
      browserKeyboardShortcuts.initKeyboardShortcuts();
      globalThis.dispatchEvent(new Event('load'));
      // When
      document.dispatchEvent(new WheelEvent('wheel', {ctrlKey: true, deltaY: -100}));
      // Then
      expect(electron.ipcRenderer.send).toHaveBeenCalledTimes(1);
      expect(electron.ipcRenderer.send).toHaveBeenCalledWith('zoomIn');
    });
    test('cmd+scrollUp, should send zoomIn event', () => {
      // Given
      browserKeyboardShortcuts.initKeyboardShortcuts();
      globalThis.dispatchEvent(new Event('load'));
      // When
      document.dispatchEvent(new WheelEvent('wheel', {metaKey: true, deltaY: -100}));
      // Then
      expect(electron.ipcRenderer.send).toHaveBeenCalledTimes(1);
      expect(electron.ipcRenderer.send).toHaveBeenCalledWith('zoomIn');
    });
    test('scrollUp, should not send events', () => {
      // Given
      browserKeyboardShortcuts.initKeyboardShortcuts();
      globalThis.dispatchEvent(new Event('load'));
      // When
      document.dispatchEvent(new WheelEvent('wheel', {deltaY: -100}));
      // Then
      expect(electron.ipcRenderer.send).not.toHaveBeenCalled();
    });
    test('ctrl+scrollDown, should send zoomOut event', () => {
      // Given
      browserKeyboardShortcuts.initKeyboardShortcuts();
      globalThis.dispatchEvent(new Event('load'));
      // When
      document.dispatchEvent(new WheelEvent('wheel', {ctrlKey: true, deltaY: 100}));
      // Then
      expect(electron.ipcRenderer.send).toHaveBeenCalledTimes(1);
      expect(electron.ipcRenderer.send).toHaveBeenCalledWith('zoomOut');
    });
    test('cmd+scrollDown, should send zoomOut event', () => {
      // Given
      browserKeyboardShortcuts.initKeyboardShortcuts();
      globalThis.dispatchEvent(new Event('load'));
      // When
      document.dispatchEvent(new WheelEvent('wheel', {metaKey: true, deltaY: 100}));
      // Then
      expect(electron.ipcRenderer.send).toHaveBeenCalledTimes(1);
      expect(electron.ipcRenderer.send).toHaveBeenCalledWith('zoomOut');
    });
    test('scrollDown, should not send events', () => {
      // Given
      browserKeyboardShortcuts.initKeyboardShortcuts();
      globalThis.dispatchEvent(new Event('load'));
      // When
      document.dispatchEvent(new WheelEvent('wheel', {deltaY: 100}));
      // Then
      expect(electron.ipcRenderer.send).not.toHaveBeenCalled();
    });
  });
});
