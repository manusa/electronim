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
describe('Main :: Global Keyboard Shortcuts module test suite', () => {
  let electron;
  let view;
  let inputEvent;
  beforeEach(() => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    view = new electron.WebContentsView({});
    require('../').registerAppShortcuts({}, view.webContents);
    inputEvent = {
      preventDefault: jest.fn()
    };
  });
  test.each([
    {key: 'Escape', shift: false, control: false, meta: false, appEvent: 'escape'},
    {key: 'F11', shift: false, control: false, meta: false, appEvent: 'fullscreenToggle'},
    {key: 'Tab', shift: false, control: true, meta: false, appEvent: 'tabTraverseNext'},
    {key: 'Tab', shift: true, control: true, meta: false, appEvent: 'tabTraversePrevious'},
    {key: 'f', shift: false, control: true, meta: false, appEvent: 'findInPageOpen'},
    {key: 'F', shift: false, control: true, meta: false, appEvent: 'findInPageOpen'},
    {key: 'f', shift: false, control: false, meta: true, appEvent: 'findInPageOpen'},
    {key: 'F', shift: false, control: false, meta: true, appEvent: 'findInPageOpen'}
  ])('Key "$key" (shift: $shift, ctrl: $control, meta: $meta) triggers "$appEvent" app event',
    ({key, shift, control, meta, appEvent}) => {
      view.listeners['before-input-event'](inputEvent, {key, control, shift, meta});
      expect(electron.ipcMain.emit).toHaveBeenCalledWith(appEvent);
    });
  describe.each([1, 2, 3, 4, 5, 6, 7, 8, 9])('Key "%s"', key => {
    test('with ctrl, triggers "tabSwitchToPosition" app event', () => {
      view.listeners['before-input-event'](inputEvent, {key, control: true});
      expect(electron.ipcMain.emit).toHaveBeenCalledWith('tabSwitchToPosition', key);
    });
    test('with meta, triggers "tabSwitchToPosition" app event', () => {
      view.listeners['before-input-event'](inputEvent, {key, meta: true});
      expect(electron.ipcMain.emit).toHaveBeenCalledWith('tabSwitchToPosition', key);
    });
    test('with no modifiers, does nothing', () => {
      view.listeners['before-input-event'](inputEvent, {key});
      expect(electron.ipcMain.emit).not.toHaveBeenCalled();
    });
  });
  test('ignores keyUp events', () => {
    view.listeners['before-input-event'](inputEvent, {type: 'keyUp', key: 'Escape'});
    expect(electron.ipcMain.emit).not.toHaveBeenCalled();
  });
  describe('preventDefault', () => {
    test('calls preventDefault if key is registered', () => {
      view.listeners['before-input-event'](inputEvent, {key: 'F11'});
      expect(inputEvent.preventDefault).toHaveBeenCalled();
    });
    test('doesn\'t call preventDefault if key is registered and preventDefault is disabled', () => {
      view.listeners['before-input-event'](inputEvent, {key: 'Esc'});
      expect(inputEvent.preventDefault).not.toHaveBeenCalled();
    });
    test('doesn\'t call preventDefault if key is not registered', () => {
      view.listeners['before-input-event'](inputEvent, {});
      expect(inputEvent.preventDefault).not.toHaveBeenCalled();
    });
  });
  describe('eventKeyForModifier', () => {
    let settings;
    beforeEach(async () => {
      settings = await require('../../__tests__').testSettings();
    });
    describe('alt modifier', () => {
      beforeEach(() => {
        settings.updateSettings({
          keyboardShortcuts: {
            tabSwitchModifier: 'alt',
            tabTraverseModifier: 'alt'
          }
        });
        require('../keyboard-shortcuts').initKeyboardEvents();
      });
      test('tabSwitchModifier set to "alt" triggers tabSwitchToPosition with alt key', () => {
        view.listeners['before-input-event'](inputEvent, {key: '1', alt: true});
        expect(electron.ipcMain.emit).toHaveBeenCalledWith('tabSwitchToPosition', 1);
      });
      test('tabTraverseModifier set to "alt" triggers tabTraverseNext with alt+Tab', () => {
        view.listeners['before-input-event'](inputEvent, {key: 'Tab', alt: true});
        expect(electron.ipcMain.emit).toHaveBeenCalledWith('tabTraverseNext');
      });
    });
    describe('meta/cmd/command modifiers', () => {
      test.each(['meta', 'cmd', 'command'])('tabSwitchModifier set to "%s" triggers tabSwitchToPosition with meta key', async modifier => {
        settings.updateSettings({
          keyboardShortcuts: {
            tabSwitchModifier: modifier,
            tabTraverseModifier: 'Ctrl'
          }
        });
        require('../keyboard-shortcuts').initKeyboardEvents();
        view.listeners['before-input-event'](inputEvent, {key: '1', meta: true});
        expect(electron.ipcMain.emit).toHaveBeenCalledWith('tabSwitchToPosition', 1);
      });
      test.each(['meta', 'cmd', 'command'])('tabTraverseModifier set to "%s" triggers tabTraverseNext with meta+Tab', async modifier => {
        settings.updateSettings({
          keyboardShortcuts: {
            tabSwitchModifier: 'Ctrl',
            tabTraverseModifier: modifier
          }
        });
        require('../keyboard-shortcuts').initKeyboardEvents();
        view.listeners['before-input-event'](inputEvent, {key: 'Tab', meta: true});
        expect(electron.ipcMain.emit).toHaveBeenCalledWith('tabTraverseNext');
      });
    });
    describe('control/ctrl modifiers', () => {
      test.each(['control', 'ctrl'])('tabSwitchModifier set to "%s" triggers tabSwitchToPosition with control key', async modifier => {
        settings.updateSettings({
          keyboardShortcuts: {
            tabSwitchModifier: modifier,
            tabTraverseModifier: 'Ctrl'
          }
        });
        require('../keyboard-shortcuts').initKeyboardEvents();
        view.listeners['before-input-event'](inputEvent, {key: '1', control: true});
        expect(electron.ipcMain.emit).toHaveBeenCalledWith('tabSwitchToPosition', 1);
      });
    });
    describe('unknown modifier (default case)', () => {
      test('throws error when tabSwitchModifier is set to unknown value', async () => {
        settings.updateSettings({
          keyboardShortcuts: {
            tabSwitchModifier: 'invalidModifier',
            tabTraverseModifier: 'Ctrl'
          }
        });
        expect(() => {
          require('../keyboard-shortcuts').initKeyboardEvents();
        }).toThrow('Unknown modifier: invalidModifier');
      });
      test('throws error when tabTraverseModifier is set to unknown value', async () => {
        settings = await require('../../__tests__').testSettings();
        settings.updateSettings({
          keyboardShortcuts: {
            tabSwitchModifier: 'Ctrl',
            tabTraverseModifier: 'unknownKey'
          }
        });
        expect(() => {
          require('../keyboard-shortcuts').initKeyboardEvents();
        }).toThrow('Unknown modifier: unknownKey');
      });
    });
  });
});
