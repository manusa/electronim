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
describe('Tab Manager context-menu test suite', () => {
  let electron;
  let event;
  let listeners;
  let mockMenu;
  let params;
  let tabManager;
  beforeEach(() => {
    jest.resetModules();
    mockMenu = {
      entries: [],
      append: jest.fn(e => mockMenu.entries.push(e)),
      popup: jest.fn()
    };
    jest.mock('electron', () => require('../../__tests__').mockElectronInstance({
      Menu: jest.fn(() => mockMenu),
      MenuItem: jest.fn(def => def)
    }));
    jest.mock('../../settings', () => ({
      loadSettings: jest.fn(() => ({
        tabs: [{id: '1337', disableNotifications: false}],
        disableNotificationsGlobally: false
      })),
      updateSettings: jest.fn()
    }));
    jest.mock('../../spell-check');
    electron = require('electron');
    electron.browserViewInstance.webContents.canGoBack = jest.fn(() => false);
    listeners = electron.browserViewInstance.listeners;
    event = new Event('');
    params = {x: 13, y: 37};
    tabManager = require('../');
    tabManager.addTabs({send: jest.fn()})([{id: '1337', url: 'https://localhost'}]);
  });
  describe('spellCheckContextMenu', () => {
    let spellChecker;
    beforeEach(() => {
      spellChecker = require('../../spell-check');
      params.misspelledWord = 'wrong-word';
    });
    test('should always popup the menu ??', async () => {
      // When
      await listeners['context-menu'](event, params);
      // Then
      expect(electron.Menu).toHaveBeenCalledTimes(1);
      expect(mockMenu.popup).toHaveBeenCalledWith({x: 13, y: 37});
    });
    describe('with native spellcheck', () => {
      beforeEach(() => {
        electron.browserViewInstance.webContents.session.spellcheck = true;
      });
      test('Spelling suggestions, should open a Menu with all suggestions', async () => {
        // Given
        spellChecker.contextMenuNativeHandler.mockImplementationOnce(() => [
          new electron.MenuItem({label: 'suggestion 1'}),
          new electron.MenuItem({label: 'suggestion 2'})
        ]);
        // When
        await listeners['context-menu'](event, params);
        // Then
        expect(spellChecker.contextMenuHandler).not.toHaveBeenCalled();
        expect(electron.MenuItem).toHaveBeenCalledWith({label: 'suggestion 1'});
        expect(electron.MenuItem).toHaveBeenCalledWith({label: 'suggestion 2'});
      });
    });
    describe('with regular spellcheck', () => {
      test('Spelling suggestions, should open a Menu with all suggestions', async () => {
        // Given
        spellChecker.contextMenuHandler.mockImplementationOnce(() => [
          new electron.MenuItem({label: 'suggestion 1'})
        ]);
        // When
        await listeners['context-menu'](event, params);
        // Then
        expect(spellChecker.contextMenuNativeHandler).not.toHaveBeenCalled();
        expect(electron.MenuItem).toHaveBeenCalledWith({label: 'suggestion 1'});
      });
    });
  });
  describe('regularContextMenu', () => {
    beforeEach(async () => {
      params.editFlags = {};
      await listeners['context-menu'](event, params);
    });
    test('should popup a menu at the specified location', async () => {
      expect(electron.Menu).toHaveBeenCalledTimes(1);
      expect(mockMenu.popup).toHaveBeenCalledWith({x: 13, y: 37});
    });
    test.each(['Back', 'Reload', 'Cut', 'Copy', 'Copy image', 'Paste', 'DevTools'])(
      'adds MenuItem with label %s', async label => {
        expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({label}));
      });
    describe('separator', () => {
      test('groups are separated by a separator', async () => {
        // separator after Back and Reload
        expect(mockMenu.entries[2].type).toBe('separator');
      });
      test('last item is not a separator', () => {
        expect(mockMenu.entries[mockMenu.entries.length - 1].type).not.toBe('separator');
      });
    });
    describe('Back', () => {
      test('disabled when canGoBack returns false', async () => {
        expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({
          enabled: false,
          label: 'Back'
        }));
      });
      test('enabled when canGoBack returns true', async () => {
        electron.browserViewInstance.webContents.canGoBack = jest.fn(() => true);
        await listeners['context-menu'](event, params);
        expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({
          enabled: false,
          label: 'Back'
        }));
      });
      test('click, should go back', async () => {
        // When
        electron.MenuItem.mock.calls.filter(c => c[0].label === 'Back')[0][0].click();
        // Then
        expect(electron.browserViewInstance.webContents.goBack).toHaveBeenCalledTimes(1);
      });
    });
    test('Reload click, should trigger reload', async () => {
      // When
      electron.MenuItem.mock.calls.filter(c => c[0].label === 'Reload')[0][0].click();
      // Then
      expect(electron.browserViewInstance.webContents.reload).toHaveBeenCalledTimes(1);
    });
    test('DevTools click, should open devtools', async () => {
      // When
      electron.MenuItem.mock.calls.filter(c => c[0].label === 'DevTools')[0][0].click();
      // Then
      expect(electron.browserViewInstance.webContents.openDevTools).toHaveBeenCalledTimes(1);
    });
    describe('Clipboard related', () => {
      describe('Cut', () => {
        test('visible when canCut', async () => {
          params.editFlags.canCut = true;
          await listeners['context-menu'](event, params);
          expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({
            visible: true,
            label: 'Cut'
          }));
        });
        test('click, should cut', async () => {
          // When
          electron.MenuItem.mock.calls.filter(c => c[0].label === 'Cut')[0][0].click();
          // Then
          expect(electron.browserViewInstance.webContents.cut).toHaveBeenCalledTimes(1);
        });
      });
      describe('Copy', () => {
        test('visible when canCopy', async () => {
          params.editFlags.canCopy = true;
          await listeners['context-menu'](event, params);
          expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({
            visible: true,
            label: 'Copy'
          }));
        });
        test('click, should copy', async () => {
          // When
          electron.MenuItem.mock.calls.filter(c => c[0].label === 'Copy')[0][0].click();
          // Then
          expect(electron.browserViewInstance.webContents.copy).toHaveBeenCalledTimes(1);
        });
      });
      describe('Copy image', () => {
        test('visible when mediaType === image', async () => {
          params.mediaType = 'image';
          await listeners['context-menu'](event, params);
          expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({
            visible: true,
            label: 'Copy image'
          }));
        });
        test('click, should copy image', async () => {
          // When
          electron.MenuItem.mock.calls.filter(c => c[0].label === 'Copy image')[0][0].click();
          // Then
          expect(electron.browserViewInstance.webContents.copyImageAt).toHaveBeenCalledTimes(1);
        });
      });
    });
    describe('Paste', () => {
      test('visible when canPaste', async () => {
        params.editFlags.canPaste = true;
        await listeners['context-menu'](event, params);
        expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({
          visible: true,
          label: 'Paste'
        }));
      });
      test('click, should paste', async () => {
        // When
        electron.MenuItem.mock.calls.filter(c => c[0].label === 'Paste')[0][0].click();
        // Then
        expect(electron.browserViewInstance.webContents.paste).toHaveBeenCalledTimes(1);
      });
    });
  });
});
