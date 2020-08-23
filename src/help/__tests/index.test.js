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
const path = require('path');
const DOCS_DIR = path.resolve(__dirname, '../../../docs');
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
  describe('fixRelativeUrls', () => {
    test('Combination of absolute and relative paths', () => {
      // Given
      const input = `
        <img src\t   =  'relativePath'/>
        <img src="https://absolute.com" /><a href="./relativeDir" />
        <a href="http://test/some-path" />
      `;
      // When
      const result = help.fixRelativeUrls(input);
      // Then
      expect(result).toBe(`
        <img src	   =  '${DOCS_DIR}/relativePath'/>
        <img src="https://absolute.com" /><a href="${DOCS_DIR}/./relativeDir" />
        <a href="http://test/some-path" />
      `);
    });
  });
  test('loadDocs, should load object with documentation', () => {
    // When
    const docs = help.loadDocs();
    // Then
    expect(Object.keys(docs)).toContain('Setup.md');
    expect(docs['Setup.md']).toMatch(/There are several options available/i);
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

