/**
 * @jest-environment node
 */
/*
   Copyright 2024 Marc Nuri San Felix

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
describe('Find in Page :: main test suite', () => {
  let electron;
  let main;
  let baseWindow;
  let eventBus;
  beforeEach(async () => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    await require('../../__tests__').testSettings();
    eventBus = electron.ipcMain;
    jest.spyOn(require('../../user-agent'), 'initBrowserVersions')
      .mockImplementation(() => Promise.resolve({}));
    main = require('../../main');
    main.init();
    baseWindow = electron.BaseWindow.getAllWindows()[0];
  });
  describe('findInPageOpen', () => {
    test('should return if find-in-page already open', () => {
      // Given
      baseWindow.contentView.children = [{isFindInPage: true}];
      // When
      eventBus.emit('findInPageOpen');
      // Then
      expect(baseWindow.contentView.addChildView).not.toHaveBeenCalled();
    });
    test('should show find-in-page', () => {
      // When
      eventBus.emit('findInPageOpen');
      // Then
      expect(baseWindow.contentView.addChildView).toHaveBeenCalledWith(
        expect.objectContaining({isFindInPage: true})
      );
      expect(baseWindow.contentView.addChildView).not.toHaveBeenCalledWith(
        expect.objectContaining({isAppMenu: true})
      );
    });
    test('should resize find-in-page', () => {
      // When
      eventBus.emit('findInPageOpen');
      // Then
      expect(baseWindow.contentView.addChildView.mock.calls[0][0].setBounds)
        .toHaveBeenCalledWith(expect.objectContaining({
          y: 0, height: 60, width: 400
        }));
    });
    test('should register did-finish-load listener to send ready event', () => {
      // When
      eventBus.emit('findInPageOpen');
      const findInPageView = baseWindow.contentView.addChildView.mock.calls[0][0];
      // Then
      expect(findInPageView.webContents.once).toHaveBeenCalledWith('did-finish-load', expect.any(Function));
      // When did-finish-load event fires
      findInPageView.listeners['did-finish-load']();
      // Then
      expect(findInPageView.webContents.send).toHaveBeenCalledWith('findInPageReady');
    });
  });
  describe('findInPageClose', () => {
    test('should stop find in page in serviceManager', () => {
      // Given
      const serviceManager = require('../../service-manager');
      serviceManager.addServices({send: jest.fn()})([{id: 'A'}]);
      // When
      eventBus.emit('findInPageClose');
      // Then
      expect(serviceManager.getService('A').webContents.stopFindInPage).toHaveBeenCalledTimes(1);
    });
    test('should remove found-in-page listener in serviceManager', () => {
      // Given
      const serviceManager = require('../../service-manager');
      serviceManager.addServices({send: jest.fn()})([{id: 'A'}]);
      // When
      eventBus.emit('findInPageClose');
      // Then
      expect(serviceManager.getService('A').webContents.removeAllListeners).toHaveBeenCalledWith('found-in-page');
    });
    test('should stop find in page in all child views', () => {
      // Given
      const childView = new electron.WebContentsView();
      baseWindow.contentView.children = [childView];
      // When
      eventBus.emit('findInPageClose');
      // Then
      expect(childView.webContents.stopFindInPage).toHaveBeenCalledWith('clearSelection');
    });
    test('should remove found-in-page listener in all child views', () => {
      // Given
      const childView = new electron.WebContentsView();
      baseWindow.contentView.children = [childView];
      // When
      eventBus.emit('findInPageClose');
      // Then
      expect(childView.webContents.removeAllListeners).toHaveBeenCalledWith('found-in-page');
    });
    test('should remove find-in-page view', () => {
      // Given
      const findInPageDialog = new electron.WebContentsView();
      findInPageDialog.isFindInPage = true;
      baseWindow.contentView.children = [findInPageDialog];
      // When
      eventBus.emit('findInPageClose');
      // Then
      expect(baseWindow.contentView.removeChildView).toHaveBeenCalledWith(findInPageDialog);
      expect(findInPageDialog.webContents.destroy).toHaveBeenCalledTimes(1);
    });
    test('should focus last remaining view', () => {
      // Given
      const findInPageDialog = new electron.WebContentsView();
      findInPageDialog.isFindInPage = true;
      const childView = new electron.WebContentsView();
      baseWindow.contentView.children = [childView, findInPageDialog];
      // When
      eventBus.emit('findInPageClose');
      // Then
      expect(childView.webContents.focus).toHaveBeenCalledTimes(1);
    });
  });
  describe('findInPage', () => {
    let findInPageDialog;
    beforeEach(() => {
      findInPageDialog = new electron.WebContentsView();
      findInPageDialog.isFindInPage = true;
      baseWindow.contentView.children = [findInPageDialog];
    });
    test('should return if no text provided', () => {
      // When
      eventBus.emit('findInPage', {}, {});
      // Then
      expect(findInPageDialog.webContents.send).not.toHaveBeenCalled();
    });
    test('should return if no page/webContents available to search in', () => {
      // When
      eventBus.emit('findInPage', {}, {text: 'test'});
      // Then
      expect(findInPageDialog.webContents.send).not.toHaveBeenCalled();
    });
    describe('with dialog', () => {
      let dialog;
      beforeEach(() => {
        dialog = new electron.WebContentsView();
        dialog.isDialog = true;
        baseWindow.contentView.children.push(dialog);
      });
      test('should register found-in-page listener', () => {
        // When
        eventBus.emit('findInPage', {}, {text: 'test'});
        // Then
        expect(dialog.webContents.on).toHaveBeenCalledWith('found-in-page', expect.any(Function));
      });
      test('found-in-page listener should send event to find-in-page dialog', () => {
        // When
        eventBus.emit('findInPage', {}, {text: 'test'});
        dialog.listeners['found-in-page']({}, {activeMatchOrdinal: 13, matches: 37});
        // Then
        expect(findInPageDialog.webContents.send).toHaveBeenCalledWith('findInPageFound', {
          activeMatchOrdinal: 13, matches: 37
        });
      });
      test('should call findInPage on webContents', () => {
        // When
        eventBus.emit('findInPage', {}, {text: 'test'});
        // Then
        expect(dialog.webContents.findInPage).toHaveBeenCalledWith('test', {forward: true});
      });
    });
    describe('with regular tab', () => {
      let tab;
      beforeEach(() => {
        const serviceManager = require('../../service-manager');
        serviceManager.addServices({send: jest.fn()})([{id: 'A'}]);
        serviceManager.setActiveService('A');
        tab = serviceManager.getService('A');
      });
      test('should register found-in-page listener', () => {
        // When
        eventBus.emit('findInPage', {}, {text: 'test'});
        // Then
        expect(tab.webContents.on).toHaveBeenCalledWith('found-in-page', expect.any(Function));
      });
      test('found-in-page listener should send event to find-in-page dialog', () => {
        // When
        eventBus.emit('findInPage', {}, {text: 'test'});
        tab.listeners['found-in-page']({}, {activeMatchOrdinal: 13, matches: 37});
        // Then
        expect(findInPageDialog.webContents.send).toHaveBeenCalledWith('findInPageFound', {
          activeMatchOrdinal: 13, matches: 37
        });
      });
      test('should call findInPage on webContents', () => {
        // When
        eventBus.emit('findInPage', {}, {text: 'test'});
        // Then
        expect(tab.webContents.findInPage).toHaveBeenCalledWith('test', {forward: true});
      });
    });
  });
});
