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
      init: jest.fn(),
      tabEls: []
    };
    mockIpcRenderer = {
      events: {},
      on: jest.fn((key, event) => (mockIpcRenderer.events[key] = event)),
      send: jest.fn()
    };
    window.ChromeTabs = jest.fn(() => mockChromeTabs);
    window.ipcRenderer = mockIpcRenderer;
    window.APP_EVENTS = {
      activateTabInContainer: 'activateTabInContainer',
      addTabs: 'addTabs',
      setTabFavicon: 'setTabFavicon',
      setTabTitle: 'setTabTitle'
    };
    ['chrome-tabs', 'settings__button'].forEach(className => {
      const $domElement = document.createElement('div');
      $domElement.innerHTML = `<div class="${className}"></div>`;
      document.body.append($domElement);
    });
    jest.isolateModules(() => {
      require('../browser-chrome-tabs');
    });
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
  describe('$chromeTabs events', () => {
    let $chromeTabs;
    beforeEach(() => {
      $chromeTabs = document.querySelector('.chrome-tabs');
    });
    test('activeTabChange', () => {
      // Given
      window.APP_EVENTS.activateTab = 'activate this tab';
      // When
      $chromeTabs.dispatchEvent(new CustomEvent('activeTabChange', {detail: {tabEl: {dataset: {tabId: 1337}}}}));
      // Then
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('activate this tab', {id: 1337});
    });
    test('tabReorder', () => {
      // Given
      window.APP_EVENTS.tabReorder = 'reorder this tab';
      // When
      $chromeTabs.dispatchEvent(new CustomEvent('tabReorder', {detail: {tabEl: {dataset: {tabId: 1337}}}}));
      // Then
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('reorder this tab', {tabIds: []});
    });
  });
  describe('ipcRenderer events', () => {
    test('activateTabInContainer, should call setCurrentTab in ChromeTabs module', () => {
      // Given
      mockChromeTabs.tabEls = [{dataset: {tabId: 1337}}];
      mockChromeTabs.setCurrentTab = jest.fn();
      // When
      mockIpcRenderer.events.activateTabInContainer(new Event(''), {tabId: 1337});
      // Then
      expect(mockChromeTabs.setCurrentTab).toHaveBeenCalledTimes(1);
      expect(mockChromeTabs.setCurrentTab).toHaveBeenCalledWith({dataset: {tabId: 1337}});
    });
    test('addTabs, should call setCurrentTab in ChromeTabs module', () => {
      // Given
      mockChromeTabs.addTab = jest.fn();
      mockChromeTabs.setCurrentTab = jest.fn();
      window.APP_EVENTS.activateTab = 'ACTIVATE TAB!';
      // When
      mockIpcRenderer.events.addTabs(new Event(''), [
        {id: 1337, active: true},
        {id: 313373, title: 'Dr.', favicon: 'Andy Warhol'}
      ]);
      // Then
      expect(mockChromeTabs.addTab).toHaveBeenCalledTimes(2);
      expect(mockChromeTabs.addTab).toHaveBeenCalledWith({id: 1337, title: 1337, favicon: false});
      expect(mockChromeTabs.addTab).toHaveBeenCalledWith({id: 313373, title: 'Dr.', favicon: 'Andy Warhol'});
      expect(mockChromeTabs.setCurrentTab).toHaveBeenCalledTimes(1);
      expect(mockIpcRenderer.send).toHaveBeenCalledTimes(1);
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('ACTIVATE TAB!', {id: 1337});
    });
    test('setTabTitle, should set DOM element text and title', () => {
      // Given
      const element = {};
      const querySelectorAll = jest.fn(() => ([element]));
      mockChromeTabs.tabEls = [{
        dataset: {tabId: 1337},
        querySelectorAll
      }];
      mockChromeTabs.setCurrentTab = jest.fn();
      // When
      mockIpcRenderer.events.setTabTitle(new Event(''), {id: 1337, title: 'Alex kid'});
      // Then
      expect(querySelectorAll).toHaveBeenCalledTimes(1);
      expect(element.innerText).toBe('Alex kid');
      expect(element.title).toBe('Alex kid');
    });
    test('setTabFavicon, should set DOM element background url', () => {
      // Given
      const element = {style: {}, removeAttribute: jest.fn()};
      const querySelectorAll = jest.fn(() => ([element]));
      mockChromeTabs.tabEls = [{
        dataset: {tabId: 1337},
        querySelectorAll
      }];
      mockChromeTabs.setCurrentTab = jest.fn();
      // When
      mockIpcRenderer.events.setTabFavicon(new Event(''), {id: 1337, favicon: 'Andy Warhol'});
      // Then
      expect(querySelectorAll).toHaveBeenCalledTimes(1);
      expect(element.style.backgroundImage).toBe('url(\'Andy Warhol\')');
      expect(element.removeAttribute).toHaveBeenCalledTimes(1);
    });
  });
});

