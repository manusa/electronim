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

describe('Main :: initBrowserVersions test suite', () => {
  let electron;
  let testUserAgent;
  let trayInitPromise;

  const waitForTrayInit = async initFn => {
    trayInitPromise = new Promise(resolve => {
      electron.ipcMain.listeners.trayInit = resolve;
    });
    initFn();
    await trayInitPromise;
  };

  beforeEach(async () => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    testUserAgent = require('../../__tests__').testUserAgent;
    const settings = await require('../../__tests__').testSettings();
    settings.updateSettings({trayEnabled: true});
  });

  describe('network error', () => {
    let show;
    beforeEach(async () => {
      await testUserAgent({
        chromiumStatus: 500,
        chromiumResponse: 'Internal Server Error',
        firefoxStatus: 500,
        firefoxResponse: 'Internal Server Error'
      });
      show = jest.fn();
      electron.Notification.mockImplementation(() => ({show}));
    });
    test('sets default user agent', async () => {
      // When
      await waitForTrayInit(() => require('../').init());
      // Then
      expect(electron.app.userAgentFallback).toContain('Mozilla');
    });
    test('shows notification', async () => {
      // When
      await waitForTrayInit(() => require('../').init());
      // Then
      expect(electron.Notification).toHaveBeenCalledWith({
        title: 'ElectronIM: No network available', urgency: 'critical'
      });
      expect(show).toHaveBeenCalledTimes(1);
    });
  });

  describe('successful', () => {
    beforeEach(async () => {
      await testUserAgent();
    });
    test('sets default user agent', async () => {
      // When
      await waitForTrayInit(() => require('../').init());
      // Then
      expect(electron.app.userAgentFallback).toContain('Mozilla');
    });
    test('initializes tray', async () => {
      // When
      await waitForTrayInit(() => require('../').init());
      // Then
      expect(electron.Tray).toHaveBeenCalledTimes(1);
    });
  });
});
