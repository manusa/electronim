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
import {jest} from '@jest/globals';
import {loadDOM} from '../../__tests__/index.mjs';
import {fireEvent} from '@testing-library/dom';

describe('Help in Browser test suite', () => {
  let mockIpcRenderer;
  beforeEach(async () => {
    jest.resetModules();
    mockIpcRenderer = {
      send: jest.fn()
    };
    jest.mock('electron', () => ({
      ipcRenderer: mockIpcRenderer,
      contextBridge: {
        exposeInMainWorld: jest.fn((api, object) => {
          window[api] = object;
        })
      }
    }));
    await import('../../../bundles/help.preload');
    window.ipcRenderer = mockIpcRenderer;
    await loadDOM({meta: import.meta, path: ['..', 'index.html']});
  });
  test('render, should render all documents', () => {
    // Then
    expect(document.querySelector('.toc-container').innerHTML)
      .toMatch(/Table of Contents/);
    const documentsContent = document.querySelector('.documents-container').innerHTML;
    expect(documentsContent).toContain('<h1>Setup</h1>');
    expect(documentsContent).toContain('<h1>Keyboard Shortcuts</h1>');
    expect(documentsContent).toContain('<h1>Troubleshooting</h1>');
  });
  test('render, should show version in footer', () => {
    // Then
    expect(document.querySelector('.documents-footer').textContent)
      .toEqual('ElectronIM version 0.0.0');
  });
  describe('Main Button events', () => {
    test('Close should send close dialog event', () => {
      // When
      fireEvent.click(document.querySelector('.top-app-bar .leading-navigation-icon'));
      // Then
      expect(mockIpcRenderer.send).toHaveBeenCalledTimes(1);
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('closeDialog');
    });
  });
});
