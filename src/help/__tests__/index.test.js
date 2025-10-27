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
describe('Help module test suite', () => {
  let electron;
  let help;
  beforeEach(() => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    help = require('../');
  });
  describe('openHelpDialog', () => {
    let baseWindow;
    let view;
    beforeEach(() => {
      baseWindow = new electron.BaseWindow();
      help.openHelpDialog(baseWindow)();
      view = electron.WebContentsView.mock.results.at(-1).value;
    });
    test('creates a WebContentsView', () => {
      expect(electron.WebContentsView).toHaveBeenCalledTimes(1);
    });
    test('loads the help HTML', () => {
      expect(view.webContents.loadURL).toHaveBeenCalledWith(
        expect.stringContaining('help/index.html')
      );
    });
    test('sets will-navigate handler', () => {
      expect(view.webContents.rawListeners('will-navigate').length).toBeGreaterThan(0);
    });
    test('has windowOpenHandler', () => {
      expect(view.webContents.setWindowOpenHandler).toHaveBeenCalledWith(expect.any(Function));
      view.webContents.getURL.mockReturnValue('file://help/index.html');
      view.webContents.setWindowOpenHandler.mock.calls[0][0]({url: 'https://example.com'});
      expect(electron.shell.openExternal).toHaveBeenCalledWith('https://example.com');
    });
    test('shows the dialog in the base window', () => {
      expect(baseWindow.contentView.addChildView).toHaveBeenCalledWith(view);
    });
    describe('webPreferences', () => {
      let webPreferences;
      beforeEach(() => {
        webPreferences = electron.WebContentsView.mock.calls.at(-1).at(0).webPreferences;
      });
      test('is sandboxed', () => {
        expect(webPreferences.sandbox).toBe(true);
      });
      test('has no node integration', () => {
        expect(webPreferences.nodeIntegration).toBe(false);
      });
      test('has context isolation', () => {
        expect(webPreferences.contextIsolation).toBe(true);
      });
    });
  });
});

