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
const {fireEvent} = require('@testing-library/dom');

const mockDOM = () => {
  document.body.innerHTML = '';
  const $root = document.createElement('div');
  $root.innerHTML = '<div class="help-root"></div>';
  document.body.append($root);
};

describe('Help in Browser test suite', () => {
  let mockIpcRenderer;
  beforeEach(() => {
    mockIpcRenderer = {
      send: jest.fn()
    };
    window.preact = require('preact');
    window.preactHooks = require('preact/hooks');
    window.htm = require('htm');
    window.APP_EVENTS = {closeDialog: 'close the dialog'};
    window.ELECTRONIM_VERSION = '1.33.7';
    window.docs = {
      'Setup.md': '<span>Setup guide</span>',
      'Keyboard-shortcuts.md': '<span>Keyboard shortcuts</span>',
      'Troubleshooting.md': '<span>Troubleshooting</span>'
    };
    window.ipcRenderer = mockIpcRenderer;
    mockDOM();
    jest.isolateModules(() => {
      require('../browser-help');
    });
  });
  test('render, should render all documents', () => {
    // Then
    expect(document.querySelector('.toc-container').innerHTML)
      .toMatch(/Table of Contents/);
    expect(document.querySelector('.documents-container').innerHTML)
      .toMatch(/Setup guide.+<span>Keyboard shortcuts.+Troubleshooting/);
  });
  test('render, should show version in footer', () => {
    // Then
    expect(document.querySelector('.documents-footer').innerHTML)
      .toMatch(/ElectronIM version 1\.33\.7/);
  });
  describe('Main Button events', () => {
    test('Close should send close dialog event', () => {
      // When
      fireEvent.click(document.querySelector('.button.is-link.is-light'));
      // Then
      expect(mockIpcRenderer.send).toHaveBeenCalledTimes(1);
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('close the dialog');
    });
  });
});
