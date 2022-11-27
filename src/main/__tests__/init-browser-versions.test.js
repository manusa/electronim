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
  let userAgent;
  beforeEach(() => {
    jest.resetModules();
    // Always mock settings unless we want to overwrite the real settings file !
    jest.mock('../../settings');
    require('../../settings').loadSettings.mockImplementation(() => ({trayEnabled: true}));
    jest.mock('electron', () => require('../../__tests__').mockElectronInstance());
    electron = require('electron');
    userAgent = require('../../user-agent');
    jest.spyOn(userAgent, 'userAgentForView').mockImplementation(() => 'UserAgent String');
  });
  describe('throws error', () => {
    let show;
    beforeEach(() => {
      jest.spyOn(userAgent, 'initBrowserVersions')
        .mockImplementation(() => ({then: () => ({catch: func => func.call()})}));
      show = jest.fn();
      electron.Notification.mockImplementation(() => ({show}));
    });
    test('sets default user agent', () => {
      // When
      require('../').init();
      // Then
      expect(electron.app.userAgentFallback).toBe('UserAgent String');
    });
    test('shows notification', () => {
      // When
      require('../').init();
      // Then
      expect(show).toHaveBeenCalledTimes(1);
    });
  });
  describe('successful', () => {
    beforeEach(() => {
      jest.spyOn(userAgent, 'initBrowserVersions')
        .mockImplementation(() => ({then: func => {
          func.call();
          return {catch: () => {}};
        }}));
    });
    test('sets default user agent', () => {
      // When
      require('../').init();
      // Then
      expect(electron.app.userAgentFallback).toBe('UserAgent String');
    });
    test('initializes tray', () => {
      // Given
      electron.ipcMain.emit = event => electron.ipcMain.listeners[event]();
      // When
      require('../').init();
      // Then
      expect(electron.Tray).toHaveBeenCalledTimes(1);
    });
  });
});
