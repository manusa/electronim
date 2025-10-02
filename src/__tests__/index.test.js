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
describe('Entrypoint test suite', () => {
  let app;
  let main;
  beforeEach(() => {
    jest.resetModules();
    jest.mock('electron', () => require('../__tests__').mockElectronInstance());
    jest.mock('../main', () => ({
      init: jest.fn()
    }));
    app = require('electron').app;
    main = require('../main');
  });
  describe('GTK workaround', () => {
    describe('on Linux platform', () => {
      beforeEach(() => {
        Object.defineProperty(process, 'platform', {
          value: 'linux',
          writable: false,
          configurable: true
        });
        require('../');
      });
      test('applies GTK version 3 workaround', () => {
        expect(app.commandLine.appendSwitch).toHaveBeenCalledWith('gtk-version', '3');
      });
    });
    describe.each(['darwin', 'win32', 'freebsd'])('on %s platform', platform => {
      beforeEach(() => {
        Object.defineProperty(process, 'platform', {
          value: platform,
          writable: false,
          configurable: true
        });
        require('../');
      });
      test('does not apply GTK workaround', () => {
        expect(app.commandLine.appendSwitch).not.toHaveBeenCalledWith('gtk-version', '3');
      });
    });
  });
  describe('App initialization', () => {
    beforeEach(() => require('../'));
    test('Sets app name', () => expect(app.name).toBe('ElectronIM'));
    test('Adds ready event listener', () => expect(app.on).toHaveBeenCalledWith('ready', main.init));
    test('Adds quit event listener', () => expect(app.on).toHaveBeenCalledWith('quit', main.quit));
    test('Registers app keyboard shortcuts on every webContents created (web-contents-created)', () => {
      expect(app.on)
        .toHaveBeenCalledWith('web-contents-created', require('../base-window').registerAppShortcuts);
    });
  });
});
