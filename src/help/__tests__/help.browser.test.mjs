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
import {fireEvent} from '@testing-library/dom';
import {loadDOM} from '../../__tests__/index.mjs';

describe('Help in Browser test suite', () => {
  let electron;
  beforeEach(async () => {
    jest.resetModules();
    electron = (await import('../../__tests__/electron.js')).testElectron();
    electron.contextBridge = {
      exposeInMainWorld: jest.fn((api, object) => {
        globalThis[api] = object;
      })
    };
    await import('../../../bundles/help.preload');
    globalThis.ipcRenderer = electron.ipcRenderer;
    await loadDOM({meta: import.meta, path: ['..', 'index.html']});
  });
  test('render, should render all documents', () => {
    // Then
    expect(document.querySelector('.toc-container').innerHTML)
      .toMatch(/Table of Contents/);
    const documentsContent = document.querySelector('.documents-container').innerHTML;
    expect(documentsContent).toContain('<h1 id="Setup.md">Setup</h1>');
    expect(documentsContent).toContain('<h1 id="Keyboard-shortcuts.md">Keyboard Shortcuts</h1>');
    expect(documentsContent).toContain('<h1 id="Troubleshooting.md">Troubleshooting</h1>');
  });
  test('render, should dynamically generate ToC from metadata', () => {
    // Then
    const tocContent = document.querySelector('.toc-container').innerHTML;
    expect(tocContent).toContain('Setup');
    expect(tocContent).toContain('Keyboard Shortcuts');
    expect(tocContent).toContain('Troubleshooting');

    // Check for links to main sections
    expect(tocContent).toContain('href="#Setup.md"');
    expect(tocContent).toContain('href="#Keyboard-shortcuts.md"');
    expect(tocContent).toContain('href="#Troubleshooting.md"');
  });
  test('render, should include sub-level ToC for H2 headings', () => {
    // Then
    const tocContent = document.querySelector('.toc-container').innerHTML;

    // Check for sublevel class
    expect(tocContent).toContain('toc-sublevel');

    // Check for H2 headings from Setup.md
    expect(tocContent).toContain('Install');
    expect(tocContent).toContain('Settings');

    // Check for links to subsections
    expect(tocContent).toMatch(/href="#Setup\.md__[^"]+"/);
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
      expect(electron.ipcRenderer.send).toHaveBeenCalledTimes(1);
      expect(electron.ipcRenderer.send).toHaveBeenCalledWith('closeDialog');
    });
  });
});
