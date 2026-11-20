/**
 * @jest-environment node
 */
/*
   Copyright 2026 Marc Nuri San Felix

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
describe('App Menu module test suite', () => {
  let electron;
  let settings;
  let appMenu;
  beforeEach(async () => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    settings = await require('../../__tests__').testSettings();
    appMenu = require('../');
  });
  describe('newAppMenu', () => {
    test('is identified as app menu', () => {
      expect(appMenu.isNotAppMenu(appMenu.newAppMenu())).toBe(false);
    });
    describe.each([
      {description: 'default settings', expected: 'tabPosition=top'},
      {description: 'tabPosition left', settings: {tabPosition: 'left'}, expected: 'tabPosition=left&tabContainerWidth=56'},
      {description: 'tabPosition left and 64px icons', settings: {tabPosition: 'left', tabIconSize: 64},
        expected: 'tabPosition=left&tabContainerWidth=96'},
      {description: 'invalid tabPosition', settings: {tabPosition: 'bottom'}, expected: 'tabPosition=top'}
    ])('with $description', ({settings: updatedSettings, expected}) => {
      beforeEach(() => {
        if (updatedSettings) {
          settings.updateSettings(updatedSettings);
        }
        appMenu.newAppMenu();
      });
      test(`loads index.html?${expected}`, () => {
        const view = electron.WebContentsView.mock.results.at(-1).value;
        expect(view.webContents.loadURL)
          .toHaveBeenCalledWith(expect.stringMatching(new RegExp(`index\\.html\\?${expected}$`)));
      });
    });
  });
});
