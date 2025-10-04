/**
 * @jest-environment node
 */
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
  let electron;
  let chromeTabs;
  beforeEach(() => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    jest.mock('../check-for-updates', () => ({
      getLatestRelease: () => Promise.resolve({})
    }));
    chromeTabs = require('../');
  });
  describe('newTabContainer', () => {
    test('webPreferences is sandboxed and has no node integration', () => {
      // When
      chromeTabs.newTabContainer();
      // Then
      const WebContentsView = electron.WebContentsView;
      expect(WebContentsView).toHaveBeenCalledTimes(1);
      expect(WebContentsView).toHaveBeenCalledWith({
        webPreferences: expect.objectContaining({sandbox: true, nodeIntegration: false})
      });
    });
    test('checks for updates', async () => {
      // Given
      const {webContentsViewInstance} = electron;
      let resolveSend;
      const isSent = new Promise(resolve => {
        resolveSend = resolve;
      });
      webContentsViewInstance.webContents.send = jest.fn(() => resolveSend(true));
      chromeTabs.newTabContainer();
      // When
      electron.ipcMain.listeners.tabsReady();
      // Then
      await expect(isSent).resolves.toBe(true);
      expect(webContentsViewInstance.webContents.send).toHaveBeenCalledWith('electronimNewVersionAvailable', true);
    });
    test('sets interval to check for updates with unref', () => {
      // Given
      const unref = jest.fn();
      global.setInterval = jest.fn(() => ({unref}));
      // When
      chromeTabs.newTabContainer();
      // Then
      expect(setInterval).toHaveBeenCalled();
      expect(unref).toHaveBeenCalled();
    });
  });
});
