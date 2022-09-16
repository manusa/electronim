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
  let mockBrowserView;
  let help;
  beforeEach(() => {
    jest.resetModules();
    mockBrowserView = {
      setAutoResize: jest.fn(),
      setBounds: jest.fn(),
      webContents: {
        on: jest.fn(),
        loadURL: jest.fn()
      }
    };
    jest.mock('electron', () => ({
      BrowserView: jest.fn(() => mockBrowserView)
    }));
    help = require('../');
  });
  describe('openHelpDialog', () => {
    let mainWindow;
    beforeEach(() => {
      mainWindow = {
        getContentBounds: jest.fn(() => ({width: 13, height: 37})),
        setBrowserView: jest.fn()
      };
    });
    test('webPreferences is sandboxed and has no node integration', () => {
      // When
      help.openHelpDialog(mainWindow)();
      // Then
      const BrowserView = require('electron').BrowserView;
      expect(BrowserView).toHaveBeenCalledTimes(1);
      expect(BrowserView).toHaveBeenCalledWith({
        webPreferences: expect.objectContaining({sandbox: true, nodeIntegration: false})
      });
    });
    test('should open dialog and add event listeners', () => {
      // When
      help.openHelpDialog(mainWindow)();
      // Then
      expect(mockBrowserView.webContents.loadURL).toHaveBeenCalledTimes(1);
      expect(mockBrowserView.webContents.loadURL).toHaveBeenCalledWith(expect.stringMatching(/.+?\/index.html$/));
      expect(mockBrowserView.webContents.on).toHaveBeenCalledWith('will-navigate', expect.any(Function));
    });
  });
});

