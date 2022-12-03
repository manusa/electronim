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
describe('About module test suite', () => {
  let electron;
  let sender;
  let about;
  beforeEach(() => {
    jest.resetModules();
    jest.mock('electron', () => require('../../__tests__').mockElectronInstance());
    electron = require('electron');
    sender = electron.browserWindowInstance.webContents;
    about = require('../');
  });
  describe('openAboutDialog', () => {
    describe('webPreferences', () => {
      test('is sandboxed', () => {
        // When
        about.openAboutDialog({sender});
        // Then
        const BrowserView = electron.BrowserView;
        expect(BrowserView).toHaveBeenCalledTimes(1);
        expect(BrowserView).toHaveBeenCalledWith({
          webPreferences: expect.objectContaining({sandbox: true, nodeIntegration: false})
        });
      });
      test('has no node integration', () => {
        // When
        about.openAboutDialog({sender});
        // Then
        expect(electron.BrowserView).toHaveBeenCalledWith({
          webPreferences: expect.objectContaining({nodeIntegration: false})
        });
      });
      test('has context isolation', () => {
        // When
        about.openAboutDialog({sender});
        // Then
        expect(electron.BrowserView).toHaveBeenCalledWith({
          webPreferences: expect.objectContaining({contextIsolation: true})
        });
      });
    });
    test('hasWindowOpenHandler', () => {
      // Given
      electron.browserViewInstance.webContents.getURL.mockReturnValue('file://about/index.html');
      about.openAboutDialog({sender});
      // When
      electron.browserViewInstance.webContents.setWindowOpenHandler.mock.calls[0][0]({url: 'https://example.com'});
      // Then
      expect(electron.shell.openExternal).toHaveBeenCalledWith('https://example.com');
    });
    test('should open dialog and add event listeners', () => {
      // When
      about.openAboutDialog({sender: electron.browserWindowInstance.webContents});
      // Then
      expect(electron.browserViewInstance.webContents.loadURL).toHaveBeenCalledTimes(1);
      expect(electron.browserViewInstance.webContents.loadURL)
        .toHaveBeenCalledWith(expect.stringMatching(/.+?\/index.html$/)); // NOSONAR
      expect(electron.browserViewInstance.webContents.on).toHaveBeenCalledWith('will-navigate', expect.any(Function));
    });
  });
});

