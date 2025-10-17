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
describe('Service Manager context-menu test suite', () => {
  let electron;
  let event;
  let listeners;
  let params;
  let serviceManager;
  beforeEach(async () => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    await require('../../__tests__').testSettings();
    jest.mock('../../spell-check');
    event = new Event('');
    params = {x: 13, y: 37};
    serviceManager = require('../');
    serviceManager.addServices({send: jest.fn()})([{id: '1337', url: 'https://localhost'}]);
    listeners = serviceManager.getService('1337').webContents.listeners;
  });
  describe('spellCheckContextMenu', () => {
    let spellChecker;
    beforeEach(() => {
      spellChecker = require('../../spell-check');
      params.misspelledWord = 'wrong-word';
    });
    test('should always popup the menu ??', async () => {
      // When
      await listeners('context-menu')(event, params);
      // Then
      expect(electron.Menu).toHaveBeenCalledTimes(1);
      expect(electron.Menu.mock.results[0].value.popup).toHaveBeenCalledWith({x: 14, y: 38});
    });
    describe('with native spellcheck', () => {
      beforeEach(() => {
        serviceManager.getService('1337').webContents.session.spellcheck = true;
      });
      test('Spelling suggestions, should open a Menu with all suggestions', async () => {
        // Given
        spellChecker.contextMenuNativeHandler.mockImplementationOnce(() => [
          new electron.MenuItem({label: 'suggestion 1'}),
          new electron.MenuItem({label: 'suggestion 2'})
        ]);
        // When
        await listeners('context-menu')(event, params);
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
        await listeners('context-menu')(event, params);
        // Then
        expect(spellChecker.contextMenuNativeHandler).not.toHaveBeenCalled();
        expect(electron.MenuItem).toHaveBeenCalledWith({label: 'suggestion 1'});
      });
    });
  });
  describe('regularContextMenu', () => {
    let mockMenu;
    beforeEach(async () => {
      params.editFlags = {};
      await listeners('context-menu')(event, params);
      mockMenu = electron.Menu.mock.results[0].value;
    });
    test('should popup a menu at the specified location (x+1, y+1)', async () => {
      expect(electron.Menu).toHaveBeenCalledTimes(1);
      expect(mockMenu.popup).toHaveBeenCalledWith({x: 14, y: 38});
    });
    test.each(['Back', 'Reload', 'Find in Page', 'Cut', 'Copy', 'Copy image', 'Paste', 'Copy link address', 'Copy link text', 'DevTools'])(
      'adds MenuItem with label %s', async label => {
        expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({label}));
      });
    describe('separator', () => {
      test('groups are separated by a separator', async () => {
        // separator after Back, Reload, and Find in Page
        expect(mockMenu.entries[3].type).toBe('separator');
      });
      test('last item is not a separator', () => {
        expect(mockMenu.entries.at(-1).type).not.toBe('separator');
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
        serviceManager.getService('1337').webContents.navigationHistory.canGoBack = jest.fn(() => true);
        await listeners('context-menu')(event, params);
        expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({
          enabled: false,
          label: 'Back'
        }));
      });
      test('click, should go back', async () => {
        // When
        electron.MenuItem.mock.calls.find(c => c[0].label === 'Back')[0].click();
        // Then
        expect(serviceManager.getService('1337').webContents.navigationHistory.goBack).toHaveBeenCalledTimes(1);
      });
    });
    test('Reload click, should trigger reload', async () => {
      // When
      electron.MenuItem.mock.calls.find(c => c[0].label === 'Reload')[0].click();
      // Then
      expect(serviceManager.getService('1337').webContents.reload).toHaveBeenCalledTimes(1);
    });
    test('Find in Page click, should trigger findInPageOpen event', async () => {
      // Given
      const findInPageListener = jest.fn();
      electron.ipcMain.once('findInPageOpen', findInPageListener);
      // When
      electron.MenuItem.mock.calls.find(c => c[0].label === 'Find in Page')[0].click();
      // Then
      expect(findInPageListener).toHaveBeenCalledTimes(1);
    });
    test('DevTools click, should open devtools', async () => {
      // When
      electron.MenuItem.mock.calls.find(c => c[0].label === 'DevTools')[0].click();
      // Then
      expect(serviceManager.getService('1337').webContents.openDevTools).toHaveBeenCalledTimes(1);
    });
    describe('Clipboard related', () => {
      describe('Cut', () => {
        test('visible when canCut', async () => {
          params.editFlags.canCut = true;
          await listeners('context-menu')(event, params);
          expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({
            visible: true,
            label: 'Cut'
          }));
        });
        test('click, should cut', async () => {
          // When
          electron.MenuItem.mock.calls.find(c => c[0].label === 'Cut')[0].click();
          // Then
          expect(serviceManager.getService('1337').webContents.cut).toHaveBeenCalledTimes(1);
        });
      });
      describe('Copy', () => {
        test('visible when canCopy and no link', async () => {
          params.editFlags.canCopy = true;
          await listeners('context-menu')(event, params);
          expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({
            visible: true,
            label: 'Copy'
          }));
        });
        test('not visible when canCopy but link is present', async () => {
          params.editFlags.canCopy = true;
          params.linkURL = 'https://example.com';
          await listeners('context-menu')(event, params);
          expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({
            visible: false,
            label: 'Copy'
          }));
        });
        test('click, should copy', async () => {
          // When
          electron.MenuItem.mock.calls.find(c => c[0].label === 'Copy')[0].click();
          // Then
          expect(serviceManager.getService('1337').webContents.copy).toHaveBeenCalledTimes(1);
        });
      });
      describe('Copy image', () => {
        test('visible when mediaType === image', async () => {
          params.mediaType = 'image';
          await listeners('context-menu')(event, params);
          expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({
            visible: true,
            label: 'Copy image'
          }));
        });
        test('click, should copy image', async () => {
          // When
          electron.MenuItem.mock.calls.find(c => c[0].label === 'Copy image')[0].click();
          // Then
          expect(serviceManager.getService('1337').webContents.copyImageAt).toHaveBeenCalledTimes(1);
        });
      });
    });
    describe('Paste', () => {
      test('visible when canPaste', async () => {
        params.editFlags.canPaste = true;
        await listeners('context-menu')(event, params);
        expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({
          visible: true,
          label: 'Paste'
        }));
      });
      test('click, should paste', async () => {
        // When
        electron.MenuItem.mock.calls.find(c => c[0].label === 'Paste')[0].click();
        // Then
        expect(serviceManager.getService('1337').webContents.paste).toHaveBeenCalledTimes(1);
      });
    });
    describe('Link context menu', () => {
      describe('Copy link address', () => {
        test('visible when linkURL is present', async () => {
          params.linkURL = 'https://example.com';
          await listeners('context-menu')(event, params);
          expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({
            visible: true,
            label: 'Copy link address'
          }));
        });
        test('not visible when linkURL is not present', async () => {
          await listeners('context-menu')(event, params);
          expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({
            visible: false,
            label: 'Copy link address'
          }));
        });
        test('click, should copy link URL to clipboard', async () => {
          params.linkURL = 'https://example.com';
          await listeners('context-menu')(event, params);
          // When
          electron.MenuItem.mock.calls.find(c => c[0].label === 'Copy link address')[0].click();
          // Then
          expect(electron.clipboard.writeText).toHaveBeenCalledWith('https://example.com');
        });
      });
      describe('Copy link text', () => {
        test('visible when linkURL and linkText are present', async () => {
          params.linkURL = 'https://example.com';
          params.linkText = 'Example Link';
          await listeners('context-menu')(event, params);
          expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({
            visible: true,
            label: 'Copy link text'
          }));
        });
        test('not visible when linkURL is not present', async () => {
          params.linkText = 'Example Link';
          await listeners('context-menu')(event, params);
          expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({
            visible: false,
            label: 'Copy link text'
          }));
        });
        test('not visible when linkText is not present', async () => {
          params.linkURL = 'https://example.com';
          await listeners('context-menu')(event, params);
          expect(electron.MenuItem).toHaveBeenCalledWith(expect.objectContaining({
            visible: false,
            label: 'Copy link text'
          }));
        });
        test('click, should copy link text to clipboard', async () => {
          params.linkURL = 'https://example.com';
          params.linkText = 'Example Link';
          await listeners('context-menu')(event, params);
          // When
          electron.MenuItem.mock.calls.find(c => c[0].label === 'Copy link text')[0].click();
          // Then
          expect(electron.clipboard.writeText).toHaveBeenCalledWith('Example Link');
        });
      });
    });
  });
});
