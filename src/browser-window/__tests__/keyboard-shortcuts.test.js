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
  let browserWindow;
  let inputEvent;
  beforeEach(() => {
    jest.resetModules();
    jest.mock('electron', () => require('../../__tests__').mockElectronInstance());
    electron = require('electron');
    browserWindow = require('../../__tests__').mockBrowserWindowInstance();
    require('../').registerAppShortcuts({}, browserWindow.webContents);
    inputEvent = {
      preventDefault: jest.fn()
    };
  });
  test.each([
    {key: 'Escape', shift: false, control: false, appEvent: 'appMenuClose'},
    {key: 'Escape', shift: false, control: false, appEvent: 'closeDialog'},
    {key: 'F11', shift: false, control: false, appEvent: 'fullscreenToggle'},
    {key: 'Tab', shift: false, control: true, appEvent: 'tabTraverseNext'},
    {key: 'Tab', shift: true, control: true, appEvent: 'tabTraversePrevious'}
  ])('Key "$key" (shift: $shift, ctrl: $control) triggers "$appEvent" app event',
    ({key, control, shift, appEvent}) => {
      browserWindow.listeners['before-input-event'](inputEvent, {key, control, shift});
      expect(electron.ipcMain.emit).toHaveBeenCalledWith(appEvent);
    });
  describe.each([1, 2, 3, 4, 5, 6, 7, 8, 9])('Key "%s"', key => {
    test('with ctrl, triggers "tabSwitchToPosition" app event', () => {
      browserWindow.listeners['before-input-event'](inputEvent, {key, control: true});
      expect(electron.ipcMain.emit).toHaveBeenCalledWith('tabSwitchToPosition', key);
    });
    test('with meta, triggers "tabSwitchToPosition" app event', () => {
      browserWindow.listeners['before-input-event'](inputEvent, {key, meta: true});
      expect(electron.ipcMain.emit).toHaveBeenCalledWith('tabSwitchToPosition', key);
    });
    test('with no modifiers, does nothing', () => {
      browserWindow.listeners['before-input-event'](inputEvent, {key});
      expect(electron.ipcMain.emit).not.toHaveBeenCalled();
    });
  });
  test('ignores keyUp events', () => {
    browserWindow.listeners['before-input-event'](inputEvent, {type: 'keyUp', key: 'Escape'});
    expect(electron.ipcMain.emit).not.toHaveBeenCalled();
  });
  describe('preventDefault', () => {
    test('calls preventDefault if key is registered', () => {
      browserWindow.listeners['before-input-event'](inputEvent, {key: 'F11'});
      expect(inputEvent.preventDefault).toHaveBeenCalled();
    });
    test('doesn\'t call preventDefault if key is registered and preventDefault is disabled', () => {
      browserWindow.listeners['before-input-event'](inputEvent, {key: 'Esc'});
      expect(inputEvent.preventDefault).not.toHaveBeenCalled();
    });
    test('doesn\'t call preventDefault if key is not registered', () => {
      browserWindow.listeners['before-input-event'](inputEvent, {});
      expect(inputEvent.preventDefault).not.toHaveBeenCalled();
    });
  });
});
