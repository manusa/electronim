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
describe('Chrome Tabs Module module test suite', () => {
  let mockBrowserView;
  let mainWindow;
  let chromeTabs;
  beforeEach(() => {
    jest.resetModules();
    mockBrowserView = {
      setAutoResize: jest.fn(),
      webContents: {
        on: jest.fn(),
        loadURL: jest.fn()
      }
    };
    jest.mock('electron', () => ({
      BrowserView: jest.fn(() => mockBrowserView)
    }));
    mainWindow = {
      addBrowserView: jest.fn()
    };
    chromeTabs = require('../');
  });
  describe('initTabContainer', () => {
    test('webPreferences is sandboxed and has no node integration', () => {
      // When
      chromeTabs.initTabContainer(mainWindow);
      // Then
      const BrowserView = require('electron').BrowserView;
      expect(BrowserView).toHaveBeenCalledTimes(1);
      expect(BrowserView).toHaveBeenCalledWith({
        webPreferences: expect.objectContaining({sandbox: true, nodeIntegration: false})
      });
    });
  });
});
