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
    mockBrowserView = {
      loadURL: jest.fn()
    };
    jest.resetModules();
    jest.mock('electron', () => ({
      BrowserView: jest.fn(() => mockBrowserView)
    }));
    help = require('../');
  });
  test('openHelpDialog, should open dialog and add event listeners', () => {
    // Given
    mockBrowserView.setBounds = jest.fn();
    mockBrowserView.setAutoResize = jest.fn();
    mockBrowserView.webContents = {loadURL: jest.fn(), on: jest.fn()};
    const mainWindow = {
      getContentBounds: jest.fn(() => ({width: 13, height: 37})),
      setBrowserView: jest.fn()
    };
    // When
    help.openHelpDialog(mainWindow)();
    // Then
    expect(mockBrowserView.webContents.loadURL).toHaveBeenCalledTimes(1);
    expect(mockBrowserView.webContents.loadURL).toHaveBeenCalledWith(expect.stringMatching(/.+?\/index.html$/));
    expect(mockBrowserView.webContents.on).toHaveBeenCalledWith('will-navigate', expect.any(Function));
  });
});

