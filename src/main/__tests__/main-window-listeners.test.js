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
describe('Main :: Main window listeners test suite', () => {
  let electron;
  let baseWindow;
  let settings;
  let appMenuModule;

  beforeEach(async () => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    settings = await require('../../__tests__').testSettings();
    await require('../../__tests__').testUserAgent();
    appMenuModule = require('../../app-menu');
    jest.spyOn(appMenuModule, 'newAppMenu', null);
    const trayInitPromise = new Promise(resolve => electron.ipcMain.on('trayInit', resolve));
    require('../').init();
    await trayInitPromise;
    baseWindow = electron.BaseWindow.getAllWindows().at(0);
  });
  describe('close', () => {
    let event;
    beforeEach(() => {
      event = {preventDefault: jest.fn()};
    });
    test('always calls event.preventDefault', () => {
      // When
      baseWindow.emit('close', event);
      // Then
      expect(event.preventDefault).toHaveBeenCalled();
    });
    test('with quit, should exit app', () => {
      // When
      baseWindow.emit('close', event);
      // Then
      expect(electron.app.exit).toHaveBeenCalled();
      expect(baseWindow.minimize).not.toHaveBeenCalled();
    });
    test('with minimize, should minimize the window', () => {
      // Given
      settings.updateSettings({closeButtonBehavior: 'minimize'});
      // When
      baseWindow.emit('close', event);
      // Then
      expect(electron.app.exit).not.toHaveBeenCalled();
      expect(baseWindow.minimize).toHaveBeenCalled();
    });
  });
  describe('resize, maximize, restore', () => {
    let views;
    let baseWindowGetContentBounds;

    beforeEach(async () => {
      jest.spyOn(globalThis, 'setTimeout');
      views = [];
      baseWindow.getSize = jest.fn(() => ([13, 37]));
      baseWindowGetContentBounds = new Promise(resolve => {
        baseWindow.getContentBounds = jest.fn(() => {
          resolve();
          return ({x: 0, y: 0, width: 10, height: 34});
        });
      });
      baseWindow.contentView.children = views;
      // Clear setTimeout spy after initialization to only count calls from the actual test
      setTimeout.mockClear();
    });
    describe('maximize', () => {
      test('single view, should set View to fit window', async () => {
        // Given
        const singleView = {
          getBounds: jest.fn(() => ({x: 0, y: 0, width: 1, height: 1}))
        };
        const setBoundsPromise = new Promise(resolve => {
          singleView.setBounds = jest.fn(resolve);
        });
        views.push(singleView);
        // When
        baseWindow.emit('maximize', {sender: baseWindow});
        await setBoundsPromise;
        // Then
        expect(singleView.setBounds).toHaveBeenCalledWith({x: 0, y: 0, width: 10, height: 34});
      });
      test('should store new size in configuration file', () => {
        // When
        baseWindow.emit('maximize', {sender: baseWindow});
        // Then
        expect(settings.loadSettings()).toEqual(expect.objectContaining({width: 13, height: 37}));
      });
    });
    describe('restore (required for windows when starting minimized)', () => {
      let mockAppMenu;
      beforeEach(async () => {
        mockAppMenu = appMenuModule.newAppMenu.mock.results[0].value;
      });
      test('should set app-menu bounds', async () => {
        const setBoundsPromise = new Promise(resolve => {
          mockAppMenu.setBounds = jest.fn(resolve);
        });
        // When
        baseWindow.emit('restore', {sender: baseWindow});
        await setBoundsPromise;
        // Then
        expect(mockAppMenu.setBounds).toHaveBeenCalledWith({x: 0, y: 0, width: 10, height: 34});
      });
    });
    describe('resize', () => {
      test('#78: should be run in separate setTimeout timer function to resize properly in Linux (no timers)', () => {
        // When
        baseWindow.emit('resize', {sender: baseWindow});
        // Then
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(baseWindow.getContentBounds).not.toHaveBeenCalled();
      });
      test('#78: should be run in separate setTimeout timer function to resize properly in Linux (timers)', async () => {
        // When
        baseWindow.emit('resize', {sender: baseWindow});
        await baseWindowGetContentBounds;
        // Then
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(baseWindow.getContentBounds).toHaveBeenCalledTimes(1);
      });
      test('should store new size in configuration file', () => {
        // When
        baseWindow.emit('resize', {sender: baseWindow});
        // Then
        expect(settings.loadSettings()).toEqual(expect.objectContaining({width: 13, height: 37}));
      });
      describe('app-menu', () => {
        let mockAppMenu;
        beforeEach(async () => {
          mockAppMenu = appMenuModule.newAppMenu.mock.results[0].value;
        });
        test('should set app-menu bounds', async () => {
          // Given
          const setBoundsPromise = new Promise(resolve => {
            mockAppMenu.setBounds = jest.fn(resolve);
          });
          // When
          baseWindow.emit('resize', {sender: baseWindow});
          await setBoundsPromise;
          // Then
          expect(mockAppMenu.setBounds).toHaveBeenCalledWith({x: 0, y: 0, width: 10, height: 34});
        });
        test('should ignore if undefined (app might be resized before app-menu is initialized)', () => {
          // Given
          mockAppMenu.setBounds = null;
          // When
          baseWindow.emit('resize', {sender: baseWindow});
          // Then
          expect(baseWindow.setBounds).not.toHaveBeenCalled();
        });
      });
      test('find-in-page, should set specific dialog bounds', () => {
        // Given
        electron.ipcMain.emit('findInPageOpen');
        const findInPageDialog = baseWindow.contentView.children.find(cv => cv.isFindInPage);
        // When
        baseWindow.emit('resize', {sender: baseWindow});
        // Then
        expect(findInPageDialog.setBounds).toHaveBeenCalledWith({x: -390, y: 0, width: 400, height: 60});
      });
      test('single view, should set View to fit window', async () => {
        // Given
        const singleView = {
          getBounds: jest.fn(() => ({x: 0, y: 0, width: 1, height: 1}))
        };
        const setBoundsPromise = new Promise(resolve => {
          singleView.setBounds = jest.fn(resolve);
        });
        views.push(singleView);
        // When
        baseWindow.emit('resize', {sender: baseWindow});
        await setBoundsPromise;
        // Then
        expect(singleView.setBounds).toHaveBeenCalledWith({x: 0, y: 0, width: 10, height: 34});
      });
      test('multiple views, should set last View to fit window and store new size in configuration file', async () => {
        // Given
        const topBar = {
          getBounds: jest.fn(() => ({x: 0, y: 0, width: 1, height: 1})),
          setBounds: jest.fn()
        };
        const content = {
          getBounds: jest.fn(() => ({x: 1337, y: 1337, width: 1, height: 1}))
        };
        const setBoundsPromise = new Promise(resolve => {
          content.setBounds = jest.fn(resolve);
        });
        views.push(topBar, content);
        // When
        baseWindow.emit('resize', {sender: baseWindow});
        await setBoundsPromise;
        // Then
        expect(settings.loadSettings()).toEqual(expect.objectContaining({width: 13, height: 37}));
        expect(topBar.setBounds).toHaveBeenCalledWith({x: 0, y: 0, width: 10, height: 1});
        expect(content.setBounds).toHaveBeenCalledWith({x: 1337, y: 1337, width: 10, height: 33});
      });
    });
  });
});
