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
  let about;
  beforeEach(() => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    about = require('../');
  });
  describe('openAboutDialog', () => {
    let openAbout;
    beforeEach(() => {
      openAbout = about.openAboutDialog(new electron.BaseWindow());
    });
    describe('webPreferences', () => {
      test('is sandboxed', () => {
        // When
        openAbout();
        // Then
        const WebContentsView = electron.WebContentsView;
        expect(WebContentsView).toHaveBeenCalledTimes(1);
        expect(WebContentsView).toHaveBeenCalledWith({
          webPreferences: expect.objectContaining({sandbox: true, nodeIntegration: false})
        });
      });
      test('has no node integration', () => {
        // When
        openAbout();
        // Then
        expect(electron.WebContentsView).toHaveBeenCalledWith({
          webPreferences: expect.objectContaining({nodeIntegration: false})
        });
      });
      test('has context isolation', () => {
        // When
        openAbout();
        // Then
        expect(electron.WebContentsView).toHaveBeenCalledWith({
          webPreferences: expect.objectContaining({contextIsolation: true})
        });
      });
    });
    test('hasWindowOpenHandler', () => {
      // Given
      electron.webContentsViewInstance.webContents.getURL.mockReturnValue('file://about/index.html');
      openAbout();
      // When
      electron.webContentsViewInstance.webContents.setWindowOpenHandler.mock.calls[0][0]({url: 'https://example.com'});
      // Then
      expect(electron.shell.openExternal).toHaveBeenCalledWith('https://example.com');
    });
    test('should open dialog and add event listeners', () => {
      // When
      openAbout();
      // Then
      expect(electron.webContentsViewInstance.webContents.loadURL).toHaveBeenCalledTimes(1);
      expect(electron.webContentsViewInstance.webContents.loadURL)
        .toHaveBeenCalledWith(expect.stringMatching(/.+?\/index.html$/)); // NOSONAR
      expect(electron.webContentsViewInstance.webContents.on).toHaveBeenCalledWith('will-navigate', expect.any(Function));
    });
  });
});

