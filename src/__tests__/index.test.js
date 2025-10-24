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
    app = require('../__tests__').testElectron().app;
    jest.mock('../main', () => ({
      init: jest.fn()
    }));
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
  describe('Custom settings path', () => {
    let originalArgv;
    let tmpDir;
    let customSettingsPath;
    let settings;
    beforeEach(() => {
      originalArgv = process.argv;
      jest.resetModules();
      tmpDir = require('node:fs').mkdtempSync(require('node:path').join(require('node:os').tmpdir(), 'electronim-test-'));
      customSettingsPath = require('node:path').join(tmpDir, 'custom-settings.json');
      require('node:fs').writeFileSync(customSettingsPath, JSON.stringify({
        tabs: [{id: 'custom-tab', name: 'Custom Tab', url: 'https://custom.example.com'}],
        customTestMarker: 'loaded-from-custom-path'
      }));
    });
    afterEach(() => {
      process.argv = originalArgv;
      if (tmpDir) {
        require('node:fs').rmSync(tmpDir, {recursive: true, force: true});
      }
    });
    describe('when --settings-path flag is provided with valid path', () => {
      beforeEach(() => {
        process.argv = ['node', 'electron', '--settings-path', customSettingsPath];
        require('../');
        settings = require('../settings');
      });
      test('loads settings from the custom path', () => {
        const loadedSettings = settings.loadSettings();
        expect(loadedSettings.customTestMarker).toBe('loaded-from-custom-path');
        expect(loadedSettings.tabs[0].id).toBe('custom-tab');
      });
    });
    describe('when --settings-path flag is not provided', () => {
      beforeEach(() => {
        process.argv = ['node', 'electron'];
        require('../');
        settings = require('../settings');
      });
      test('loads settings from default path', () => {
        const loadedSettings = settings.loadSettings();
        expect(loadedSettings.customTestMarker).toBeUndefined();
      });
    });
    describe('when running as packaged app (without defaultApp)', () => {
      beforeEach(() => {
        process.defaultApp = false;
        process.argv = ['electron', '--settings-path', customSettingsPath];
        require('../');
        settings = require('../settings');
      });
      test('loads settings from the custom path', () => {
        const loadedSettings = settings.loadSettings();
        expect(loadedSettings.customTestMarker).toBe('loaded-from-custom-path');
      });
    });
  });
  describe('Custom user data path', () => {
    let originalArgv;
    let customUserDataPath;
    beforeEach(() => {
      originalArgv = process.argv;
      jest.resetModules();
      app = require('../__tests__').testElectron().app;
      customUserDataPath = '/custom/user/data/path';
    });
    afterEach(() => {
      process.argv = originalArgv;
    });
    describe('when --user-data flag is provided with valid path', () => {
      beforeEach(() => {
        process.argv = ['node', 'electron', '--user-data', customUserDataPath];
        require('../');
      });
      test('sets user data path before app initialization', () => {
        expect(app.setPath).toHaveBeenCalledWith('userData', customUserDataPath);
      });
    });
    describe('when --user-data flag is not provided', () => {
      beforeEach(() => {
        process.argv = ['node', 'electron'];
        require('../');
      });
      test('does not set custom user data path', () => {
        expect(app.setPath).not.toHaveBeenCalledWith('userData', expect.anything());
      });
    });
    describe('when running as packaged app (without defaultApp)', () => {
      beforeEach(() => {
        process.defaultApp = false;
        process.argv = ['electron', '--user-data', customUserDataPath];
        require('../');
      });
      test('sets user data path from argv[1] onwards', () => {
        expect(app.setPath).toHaveBeenCalledWith('userData', customUserDataPath);
      });
    });
    describe('when both --user-data and --settings-path are provided', () => {
      beforeEach(() => {
        process.argv = ['node', 'electron', '--user-data', customUserDataPath, '--settings-path', '/custom/settings.json'];
        require('../');
      });
      test('sets both paths correctly', () => {
        expect(app.setPath).toHaveBeenCalledWith('userData', customUserDataPath);
      });
    });
  });
});
