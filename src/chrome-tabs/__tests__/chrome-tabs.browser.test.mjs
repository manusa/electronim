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
import {createEvent, fireEvent, waitFor} from '@testing-library/dom';

describe('ChromeTabs in Browser test suite', () => {
  let mockIpcRenderer;
  let $chromeTabs;
  beforeEach(async () => {
    jest.resetModules();
    mockIpcRenderer = {
      events: {},
      on: jest.fn((key, event) => (mockIpcRenderer.events[key] = event)),
      send: jest.fn()
    };
    await import('../../../bundles/chrome-tabs.preload');
    window.ipcRenderer = mockIpcRenderer;
    await loadDOM({meta: import.meta, path: ['..', 'index.html']});
    $chromeTabs = await waitFor(() => document.querySelector('.chrome-tabs'));
  });
  test('APP_EVENTS.tabsReady should be fired on load', () => {
    expect(mockIpcRenderer.send).toHaveBeenCalledWith('tabsReady', {});
  });
  describe('External events (ipcRenderer.on)', () => {
    let tabs;
    beforeEach(() => {
      Object.defineProperty($chromeTabs, 'clientWidth', {value: 100});
      window.dispatchEvent(new CustomEvent('resize'));
      tabs = [
        {id: 1337, active: true, url: 'https://1337.com'},
        {id: 313373, title: '313373', url: 'https://313373.com'},
        {id: 13373, favicon: 'https://13373.png', url: 'https://13373.com'}
      ];
    });
    test('addTabs, should set tabs', async () => {
      // When
      mockIpcRenderer.events.addTabs({}, tabs);
      // Then
      await waitFor(() =>
        expect($chromeTabs.querySelectorAll('.chrome-tab').length).toBe(3));
      const $addedTabs = $chromeTabs.querySelectorAll('.chrome-tab');
      $addedTabs.forEach(tab => expect(tab.style.width).toBe('259px'));
      expect($addedTabs[0].querySelector('.chrome-tab-title').innerHTML)
        .toBe('https://1337.com');
      expect($addedTabs[0].hasAttribute('active')).toBe(true);
      expect($addedTabs[1].querySelector('.chrome-tab-title').innerHTML)
        .toBe('313373');
      expect($addedTabs[1].hasAttribute('active')).toBe(false);
      expect($addedTabs[2].querySelector('.chrome-tab-favicon').style.backgroundImage)
        .toBe('url(https://13373.png)');
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('activateTab', {id: 1337});
    });
    test('activateTabInContainer, should change active tab', async () => {
      // Given
      mockIpcRenderer.events.addTabs({}, tabs);
      // When
      mockIpcRenderer.events.activateTabInContainer({}, {tabId: 313373});
      // Then
      await waitFor(() =>
        expect($chromeTabs.querySelector('.chrome-tab[data-tab-id="313373"]').hasAttribute('active')).toBe(true));
    });
    describe('electronimNewVersionAvailable is true', () => {
      beforeEach(() => {
        mockIpcRenderer.events.electronimNewVersionAvailable({}, true);
      });
      test('Main button shows arrow up', async () => {
        await waitFor(() =>
          expect(document.querySelector('.menu__button').textContent)
            .toBe('\uf182'));
      });
      test('Main button has tooltip informing about new updates', async () => {
        await waitFor(() =>
          expect(document.querySelector('.menu__button').getAttribute('title'))
            .toBe('New ElectronIM version is available'));
      });
    });
    test('setTabFavicon, should change favicon of specified tab', async () => {
      // Given
      mockIpcRenderer.events.addTabs({}, tabs);
      // When
      mockIpcRenderer.events.setTabFavicon({}, {id: 313373, favicon: 'https://f/replaced.png'});
      // Then
      await waitFor(() => expect(
        $chromeTabs.querySelector('.chrome-tab[data-tab-id="313373"] .chrome-tab-favicon').style.backgroundImage)
        .toBe('url(https://f/replaced.png)'));
      expect(
        $chromeTabs.querySelector('.chrome-tab[data-tab-id="13373"] .chrome-tab-favicon').style.backgroundImage)
        .toBe('url(https://13373.png)');
    });
    test('setTabTitle, should change title of specified tab', async () => {
      // Given
      mockIpcRenderer.events.addTabs({}, tabs);
      // When
      mockIpcRenderer.events.setTabTitle({}, {id: 313373, title: 'replaced'});
      // Then
      await waitFor(() => expect(
        $chromeTabs.querySelector('.chrome-tab[data-tab-id="313373"] .chrome-tab-title').innerHTML)
        .toBe('replaced'));
      expect(
        $chromeTabs.querySelector('.chrome-tab[data-tab-id="1337"] .chrome-tab-title').innerHTML)
        .toBe('https://1337.com');
    });
  });
  describe('Tab events', () => {
    let tabs;
    beforeEach(async () => {
      tabs = [
        {id: 1337, active: true, url: 'https://1337.com'},
        {id: 313373, title: '313373', url: 'https://313373.com'},
        {id: 13373, favicon: 'https://13373.png', url: 'https://13373.com'}
      ];
      Object.defineProperty($chromeTabs, 'clientWidth', {value: 100});
      window.dispatchEvent(new CustomEvent('resize'));
      mockIpcRenderer.events.addTabs({}, tabs);
      await waitFor(() => {
        if ($chromeTabs.querySelectorAll('.chrome-tab').length !== 3) {
          throw Error('Tabs are not ready');
        }
      });
    });
    test('click, on inactive tab, should request tab activation', () => {
      // When
      fireEvent.click($chromeTabs.querySelector('.chrome-tab[data-tab-id="313373"]'));
      // Then
      expect(mockIpcRenderer.send).toHaveBeenNthCalledWith(3, 'activateTab', {id: 313373});
    });
    test('click, on active tab, should do nothing', () => {
      // When
      fireEvent.click($chromeTabs.querySelector('.chrome-tab[data-tab-id="1337"]'));
      // Then
      expect(mockIpcRenderer.send).toHaveBeenCalledTimes(2);
    });
    test('dragOver, should invoke preventDefault to allow drop', () => {
      // Given
      const event = createEvent.dragOver($chromeTabs);
      jest.spyOn(event, 'preventDefault');
      // When
      fireEvent($chromeTabs, event);
      // Then
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });
    test('dragStart, should activate tab and set initial drag values', () => {
      // Given
      const $tab = $chromeTabs.querySelector('.chrome-tab[data-tab-id="1337"]');
      const event = new MouseEvent('dragstart', {
        clientX: 100, clientY: 0});
      Object.defineProperty(event, 'dataTransfer', {value: {
        setDragImage: jest.fn()
      }});
      // When
      fireEvent($tab, event);
      // Then
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('activateTab', {id: 1337});
      expect(event.dataTransfer.setDragImage).toHaveBeenCalledTimes(1);
    });
    test('drag, same position, should keep positions moving current tab left', async () => {
      // Given
      const $tab = $chromeTabs.querySelector('.chrome-tab[data-tab-id="1337"]');
      const event = new MouseEvent('drag', {clientX: 100, clientY: 1});
      // When
      fireEvent($tab, event);
      // Then
      await waitFor(() =>
        expect($chromeTabs.querySelector('.chrome-tab[data-tab-id="1337"]').style.left).toBe('100px'));
      expect($chromeTabs.querySelectorAll('.chrome-tab')[0].dataset.tabId).toBe('1337');
    });
    test('drag, one position right, should switch positions in array', async () => {
      // Given
      const $tab = $chromeTabs.querySelector('.chrome-tab[data-tab-id="1337"]');
      const event = new MouseEvent('drag', {clientX: 200, clientY: 1});
      // When
      fireEvent($tab, event);
      // Then
      await waitFor(() =>
        expect($chromeTabs.querySelectorAll('.chrome-tab')[0].dataset.tabId).toBe('313373'));
      expect($chromeTabs.querySelectorAll('.chrome-tab')[1].dataset.tabId).toBe('1337');
      expect(mockIpcRenderer.send).toHaveBeenCalledTimes(3);
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('tabReorder', {tabIds: [313373, 1337, 13373]});
    });
    test('drag, one position right out of window, should leave tabs as before drag started', async () => {
      // Given
      const $tab = $chromeTabs.querySelector('.chrome-tab[data-tab-id="1337"]');
      const event = new MouseEvent('drag', {clientX: 200, clientY: -100});
      // When
      fireEvent($tab, event);
      // Then
      await waitFor(() =>
        expect(mockIpcRenderer.send).toHaveBeenCalledWith('tabReorder', {tabIds: [1337, 313373, 13373]}));
      expect(mockIpcRenderer.send).toHaveBeenCalledTimes(3);
      expect($chromeTabs.querySelectorAll('.chrome-tab')[0].dataset.tabId).toBe('1337');
    });
  });
  describe('Main button events', () => {
    test('shows 3 bars when no updates available', () => {
      const buttonClass = document.querySelector('.menu__button').textContent;
      expect(buttonClass).toBe('\ue5d4');
    });
    test('menuButton click, should dispatch APP_EVENTS.appMenuOpen', () => {
      // When
      fireEvent.click(document.querySelector('.menu__button'));
      // Then
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('appMenuOpen');
    });
  });
});

