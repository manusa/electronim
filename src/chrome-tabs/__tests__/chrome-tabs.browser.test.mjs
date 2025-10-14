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
  let electron;
  let tabsReady;
  let $chromeTabs;
  beforeEach(async () => {
    jest.resetModules();
    electron = await (await import('../../__tests__/electron.mjs')).testElectron();
    tabsReady = jest.fn();
    electron.ipcMain.once('tabsReady', tabsReady);
    await import('../../../bundles/chrome-tabs.preload');
    await loadDOM({meta: import.meta, path: ['..', 'index.html']});
    $chromeTabs = await waitFor(() => document.querySelector('.chrome-tabs'));
  });
  test('APP_EVENTS.tabsReady should be fired on load', () => {
    expect(tabsReady).toHaveBeenCalledTimes(1);
    expect(tabsReady).toHaveBeenCalledWith({});
  });
  describe('External events (ipcRenderer.on)', () => {
    let tabs;
    beforeEach(() => {
      Object.defineProperty($chromeTabs, 'clientWidth', {value: 100});
      globalThis.dispatchEvent(new CustomEvent('resize'));
      tabs = [
        {id: 1337, active: true, url: 'https://1337.com'},
        {id: 313373, title: '313373', url: 'https://313373.com'},
        {id: 13373, favicon: 'https://13373.png', url: 'https://13373.com'}
      ];
    });
    test('addServices, should set tabs without restoring the main window / activating any tab', async () => {
      // Given
      const activateService = jest.fn();
      electron.ipcMain.once('activateService', activateService);
      // When
      electron.ipcRenderer.emit('addServices', {}, tabs);
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
      expect($addedTabs[2].querySelector('.chrome-tab-favicon-icon').getAttribute('src'))
        .toBe('https://13373.png');
      expect(activateService).toHaveBeenCalledWith({id: 1337, restoreWindow: false});
    });
    test('activateServiceInContainer, should change active tab', async () => {
      // Given
      electron.ipcRenderer.emit('addServices', {}, tabs);
      // When
      electron.ipcRenderer.emit('activateServiceInContainer', {}, {tabId: 313373});
      // Then
      await waitFor(() =>
        expect($chromeTabs.querySelector('.chrome-tab[data-tab-id="313373"]').hasAttribute('active')).toBe(true));
    });
    describe('electronimNewVersionAvailable is true', () => {
      beforeEach(() => {
        electron.ipcRenderer.emit('electronimNewVersionAvailable', {}, true);
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
      electron.ipcRenderer.emit('addServices', {}, tabs);
      // When
      electron.ipcRenderer.emit('setTabFavicon', {}, {id: 313373, favicon: 'https://f/replaced.png'});
      // Then
      await waitFor(() => expect(
        $chromeTabs.querySelector('.chrome-tab[data-tab-id="313373"] .chrome-tab-favicon-icon').getAttribute('src'))
        .toBe('https://f/replaced.png'));
      expect(
        $chromeTabs.querySelector('.chrome-tab[data-tab-id="13373"] .chrome-tab-favicon-icon').getAttribute('src'))
        .toBe('https://13373.png');
    });
    test('setServiceTitle, should change title of specified tab', async () => {
      // Given
      electron.ipcRenderer.emit('addServices', {}, tabs);
      // When
      electron.ipcRenderer.emit('setServiceTitle', {}, {id: 313373, title: 'replaced'});
      // Then
      await waitFor(() => expect(
        $chromeTabs.querySelector('.chrome-tab[data-tab-id="313373"] .chrome-tab-title').innerHTML)
        .toBe('replaced'));
      expect(
        $chromeTabs.querySelector('.chrome-tab[data-tab-id="1337"] .chrome-tab-title').innerHTML)
        .toBe('https://1337.com');
    });
    test('addServices with customName, should display customName instead of title', async () => {
      // Given
      const tabsWithCustomName = [
        {id: 1, customName: 'My Custom Tab', title: 'Original Title', url: 'https://test.com'},
        {id: 2, title: 'Normal Tab', url: 'https://normal.com'}
      ];
      // When
      electron.ipcRenderer.emit('addServices', {}, tabsWithCustomName);
      // Then
      await waitFor(() =>
        expect($chromeTabs.querySelectorAll('.chrome-tab').length).toBe(2));
      expect($chromeTabs.querySelector('.chrome-tab[data-tab-id="1"] .chrome-tab-title').innerHTML)
        .toBe('My Custom Tab');
      expect($chromeTabs.querySelector('.chrome-tab[data-tab-id="2"] .chrome-tab-title').innerHTML)
        .toBe('Normal Tab');
    });
    test('setServiceTitle with existing customName, should not change displayed name', async () => {
      // Given
      const tabsWithCustomName = [
        {id: 1, customName: 'My Custom Tab', title: 'Original Title', url: 'https://test.com'}
      ];
      electron.ipcRenderer.emit('addServices', {}, tabsWithCustomName);
      await waitFor(() =>
        expect($chromeTabs.querySelector('.chrome-tab[data-tab-id="1"] .chrome-tab-title').innerHTML)
          .toBe('My Custom Tab'));
      // When
      electron.ipcRenderer.emit('setServiceTitle', {}, {id: 1, title: 'New Page Title'});
      // Then
      await waitFor(() =>
        expect($chromeTabs.querySelector('.chrome-tab[data-tab-id="1"] .chrome-tab-title').innerHTML)
          .toBe('My Custom Tab'));
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
      globalThis.dispatchEvent(new CustomEvent('resize'));
      electron.ipcRenderer.emit('addServices', {}, tabs);
      await waitFor(() => {
        if ($chromeTabs.querySelectorAll('.chrome-tab').length !== 3) {
          throw new Error('Tabs are not ready');
        }
      });
    });
    test('click, on inactive tab, should request tab activation', () => {
      // Given
      const activateService = jest.fn();
      electron.ipcMain.on('activateService', activateService);
      // When
      fireEvent.click($chromeTabs.querySelector('.chrome-tab[data-tab-id="313373"]'));
      // Then
      expect(activateService).toHaveBeenCalledWith({id: 313373, restoreWindow: true});
    });
    test('click, on active tab, should do nothing', () => {
      // Given
      const activateService = jest.fn();
      electron.ipcMain.once('activateService', activateService);
      // When
      fireEvent.click($chromeTabs.querySelector('.chrome-tab[data-tab-id="1337"]'));
      // Then
      expect(activateService).not.toHaveBeenCalled();
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
    test('dragStart, on inactive tab, should activate tab and set initial drag values', () => {
      // Given
      const activateService = jest.fn();
      electron.ipcMain.once('activateService', activateService);
      const $tab = $chromeTabs.querySelector('.chrome-tab[data-tab-id="313373"]');
      const event = new MouseEvent('dragstart', {
        clientX: 100, clientY: 0});
      Object.defineProperty(event, 'dataTransfer', {value: {
        setDragImage: jest.fn()
      }});
      // When
      fireEvent($tab, event);
      // Then
      expect(activateService).toHaveBeenCalledWith({id: 313373, restoreWindow: true});
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
      const tabReorder = jest.fn();
      electron.ipcMain.on('tabReorder', tabReorder);
      const $tab = $chromeTabs.querySelector('.chrome-tab[data-tab-id="1337"]');
      const event = new MouseEvent('drag', {clientX: 200, clientY: 1});
      // When
      fireEvent($tab, event);
      // Then
      await waitFor(() =>
        expect($chromeTabs.querySelectorAll('.chrome-tab')[0].dataset.tabId).toBe('313373'));
      expect($chromeTabs.querySelectorAll('.chrome-tab')[1].dataset.tabId).toBe('1337');
      expect(tabReorder).toHaveBeenCalledTimes(1);
      expect(tabReorder).toHaveBeenCalledWith({tabIds: [313373, 1337, 13373]});
    });
    test('drag, one position right out of window, should leave tabs as before drag started', async () => {
      // Given
      const tabReorder = jest.fn();
      electron.ipcMain.on('tabReorder', tabReorder);
      const $tab = $chromeTabs.querySelector('.chrome-tab[data-tab-id="1337"]');
      const event = new MouseEvent('drag', {clientX: 200, clientY: -100});
      // When
      fireEvent($tab, event);
      // Then
      await waitFor(() =>
        expect(tabReorder).toHaveBeenCalledWith({tabIds: [1337, 313373, 13373]}));
      expect(tabReorder).toHaveBeenCalledTimes(1);
      expect($chromeTabs.querySelectorAll('.chrome-tab')[0].dataset.tabId).toBe('1337');
    });
  });
  describe('Main button events', () => {
    test('shows 3 bars when no updates available', () => {
      const buttonClass = document.querySelector('.menu__button').textContent;
      expect(buttonClass).toBe('\ue5d4');
    });
    test('menuButton click, should dispatch APP_EVENTS.appMenuOpen', () => {
      // Given
      const appMenuOpen = jest.fn();
      electron.ipcMain.once('appMenuOpen', appMenuOpen);
      // When
      fireEvent.click(document.querySelector('.menu__button'));
      // Then
      expect(appMenuOpen).toHaveBeenCalledTimes(1);
    });
  });
  describe('Context menu tab ID detection (DOM integration)', () => {
    let tabs;
    beforeEach(async () => {
      tabs = [
        {id: 1337, active: true, url: 'https://1337.com'},
        {id: 313373, title: '313373', url: 'https://313373.com'},
        {id: 13373, favicon: 'https://13373.png', url: 'https://13373.com'}
      ];
      Object.defineProperty($chromeTabs, 'clientWidth', {value: 100});
      globalThis.dispatchEvent(new CustomEvent('resize'));
      electron.ipcRenderer.emit('addServices', {}, tabs);
      await waitFor(() => {
        if ($chromeTabs.querySelectorAll('.chrome-tab').length !== 3) {
          throw new Error('Tabs are not ready');
        }
      });
    });
    test('should verify all tabs have data-tab-id attribute', () => {
      // This test verifies that the DOM structure matches what the context menu handler expects
      // The production code (chrome-tabs/index.js:43-48) uses element.closest('.chrome-tab')
      // and getAttribute('data-tab-id'), so we need to ensure these exist
      const tabElements = $chromeTabs.querySelectorAll('.chrome-tab');
      expect(tabElements.length).toBe(3);

      tabElements.forEach((tab, index) => {
        expect('tabId' in tab.dataset).toBe(true);
        expect(tab.dataset.tabId).toBe(String(tabs[index].id));
      });
    });
    test('should verify chrome-tab class exists on all tab elements', () => {
      const tabElements = $chromeTabs.querySelectorAll('.chrome-tab');
      expect(tabElements.length).toBe(3);

      tabElements.forEach(tab => {
        expect(tab.classList.contains('chrome-tab')).toBe(true);
      });
    });
    test('should find tab element using closest from child elements', () => {
      // This test verifies the exact behavior used in production (chrome-tabs/index.js:46)
      // where element.closest('.chrome-tab') is called on any clicked child element

      // Test from tab title
      const tabTitle = $chromeTabs.querySelector('.chrome-tab[data-tab-id="1337"] .chrome-tab-title');
      expect(tabTitle).not.toBeNull();
      const tabFromTitle = tabTitle.closest('.chrome-tab');
      expect(tabFromTitle).not.toBeNull();
      expect(tabFromTitle.dataset.tabId).toBe('1337');

      // Test from tab favicon
      const tabFavicon = $chromeTabs.querySelector('.chrome-tab[data-tab-id="13373"] .chrome-tab-favicon-icon');
      expect(tabFavicon).not.toBeNull();
      const tabFromFavicon = tabFavicon.closest('.chrome-tab');
      expect(tabFromFavicon).not.toBeNull();
      expect(tabFromFavicon.dataset.tabId).toBe('13373');
    });
    test('should return null when closest is called on non-tab elements', () => {
      // Verify that elements outside of tabs don't have .chrome-tab as ancestor
      const menuButton = document.querySelector('.menu__button');
      expect(menuButton).not.toBeNull();
      const tabElement = menuButton.closest('.chrome-tab');
      expect(tabElement).toBeNull();
    });
    test('should verify tab child elements exist for context menu interaction', () => {
      // Verify that tabs have the expected child elements that users might click on
      const tab = $chromeTabs.querySelector('.chrome-tab[data-tab-id="313373"]');
      expect(tab).not.toBeNull();

      // Verify title element exists
      const titleElement = tab.querySelector('.chrome-tab-title');
      expect(titleElement).not.toBeNull();
      expect(titleElement.textContent).toBe('313373');

      // Verify that clicking on any child element can find the parent tab
      expect(titleElement.closest('.chrome-tab')).toBe(tab);
    });
    test('should verify all tabs can be found using data-tab-id selector', () => {
      // The production code uses getAttribute('data-tab-id') to get the ID
      // This test ensures the selector pattern works correctly
      tabs.forEach(tabData => {
        const tab = $chromeTabs.querySelector(`.chrome-tab[data-tab-id="${tabData.id}"]`);
        expect(tab).not.toBeNull();
        expect(tab.dataset.tabId).toBe(String(tabData.id));
      });
    });
  });
});

