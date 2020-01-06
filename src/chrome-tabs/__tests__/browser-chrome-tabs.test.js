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
describe('ChromeTabs in Browser test suite', () => {
  let mockChromeTabs;
  let mockIpcRenderer;
  beforeEach(() => {
    mockChromeTabs = {
      init: jest.fn()
    };
    mockIpcRenderer = {
      on: jest.fn(),
      send: jest.fn()
    };
    window.ChromeTabs = jest.fn(() => mockChromeTabs);
    window.ipcRenderer = mockIpcRenderer;
    window.APP_EVENTS = {};
    ['chrome-tabs', 'settings__button'].forEach(className => {
      const $domElement = document.createElement('div');
      $domElement.innerHTML = `<div class="${className}"></div>`;
      document.body.append($domElement);
    });
    require('../browser-chrome-tabs');
  });
  test('settingsButton click, should dispatch APP_EVENTS.settingsOpenDialog', () => {
    // Given
    window.APP_EVENTS.settingsOpenDialog = 'open your settings please';
    const $settingsButton = document.querySelector('.settings__button');
    // When
    $settingsButton.dispatchEvent(new Event('click'));
    // Then
    expect(mockIpcRenderer.send).toHaveBeenCalledWith('open your settings please');
  });
});

