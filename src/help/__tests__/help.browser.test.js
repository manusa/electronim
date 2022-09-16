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
    require('../../../bundles/help.preload');
    mockIpcRenderer = {
      send: jest.fn()
    };
    mockDOM();
    window.ipcRenderer = mockIpcRenderer;
    window.ELECTRONIM_VERSION = '1.33.7';
    jest.isolateModules(() => {
      require('../help.browser');
    });
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
    expect(document.querySelector('.documents-footer').innerHTML)
      .toMatch(/ElectronIM version 1\.33\.7/);
  });
  describe('Main Button events', () => {
    test('Close should send close dialog event', () => {
      // When
      fireEvent.click(document.querySelector('.button.is-link.is-light'));
      // Then
      expect(mockIpcRenderer.send).toHaveBeenCalledTimes(1);
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('closeDialog');
    });
  });
});
