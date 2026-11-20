/*
   Copyright 2026 Marc Nuri San Felix

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
import {fireEvent, waitFor} from '@testing-library/dom';
import {loadDOM, testElectron} from '../../__tests__/index.mjs';

describe('ChromeTabs (vertical, tabPosition=left) in Browser test suite', () => {
  let electron;
  let $tabContainer;
  const $tab = id => $tabContainer.querySelector(`.vertical-tab[data-tab-id="${id}"]`);
  beforeEach(async () => {
    jest.resetModules();
    globalThis.history.replaceState(null, '', '?tabPosition=left&tabIconSize=48');
    electron = await testElectron();
    await import('../../../bundles/chrome-tabs.preload');
    await loadDOM({meta: import.meta, path: ['..', 'index.html']});
    $tabContainer = await waitFor(() => document.querySelector('.tab-container--vertical'));
    await waitFor(() => expect($tabContainer.querySelector('.vertical-tabs')).not.toBeNull());
  });
  afterEach(() => {
    globalThis.history.replaceState(null, '', '/');
  });
  test('renders the vertical rail instead of the horizontal Chrome tabs', () => {
    expect($tabContainer.querySelector('.chrome-tabs')).toBeNull();
  });
  test('sizes the icons with the tabIconSize query parameter', () => {
    expect($tabContainer.style.getPropertyValue('--vertical-tab-icon-size')).toBe('48px');
  });
  test('renders the menu button', () => {
    expect($tabContainer.querySelector('.menu__button')).not.toBeNull();
  });
  describe('addServices', () => {
    beforeEach(async () => {
      electron.ipcRenderer.emit('addServices', {}, [
        {id: 1, active: true, url: 'https://one.com', favicon: 'https://one.com/favicon.png'},
        {id: 2, title: 'Two', url: 'https://two.com', favicon: 'https://two.com/favicon.png',
          customIcon: 'https://custom/two.png'},
        {id: 3, customName: 'my service', title: 'Three', url: 'https://three.com'},
        {id: 4, title: '(3) Four', url: 'https://four.com', disableNotifications: true}
      ]);
      await waitFor(() => expect($tabContainer.querySelectorAll('.vertical-tab')).toHaveLength(4));
    });
    test('highlights the active service', () => {
      expect($tab(1).classList).toContain('vertical-tab--active');
    });
    test('marks the active service as current for assistive technologies', () => {
      expect($tab(1).getAttribute('aria-current')).toBe('page');
    });
    test('does not highlight inactive services', () => {
      expect($tab(2).classList).not.toContain('vertical-tab--active');
    });
    test('does not mark inactive services as current', () => {
      expect($tab(2).hasAttribute('aria-current')).toBe(false);
    });
    test('shows the favicon', () => {
      expect($tab(1).querySelector('img.vertical-tab__icon').getAttribute('src')).toBe('https://one.com/favicon.png');
    });
    test('loads the favicon as a CORS request (CORP headers, #454)', () => {
      expect($tab(1).querySelector('img.vertical-tab__icon').getAttribute('crossorigin')).toBe('anonymous');
    });
    test('shows the custom icon instead of the favicon', () => {
      expect($tab(2).querySelector('img.vertical-tab__icon').getAttribute('src')).toBe('https://custom/two.png');
    });
    test('loads the custom icon as a plain image request', () => {
      expect($tab(2).querySelector('img.vertical-tab__icon').hasAttribute('crossorigin')).toBe(false);
    });
    test('with a custom icon that fails to load, shows the favicon', async () => {
      // When
      fireEvent.error($tab(2).querySelector('img.vertical-tab__icon'));
      // Then
      await waitFor(() => expect($tab(2).querySelector('img.vertical-tab__icon').getAttribute('src'))
        .toBe('https://two.com/favicon.png'));
    });
    test('without any icon, shows the first letter of the name', () => {
      expect($tab(3).querySelector('.vertical-tab__icon--placeholder').textContent).toBe('m');
    });
    test('without any icon, skips the unread count and symbols for the first letter', async () => {
      // When
      electron.ipcRenderer.emit('setServiceTitle', {}, {id: 4, title: '(3) - Four'});
      await waitFor(() => expect($tab(4).getAttribute('title')).toBe('(3) - Four'));
      // Then
      expect($tab(4).querySelector('.vertical-tab__icon--placeholder').textContent).toBe('F');
    });
    test('with a favicon that fails to load, shows the first letter of the host name', async () => {
      // When
      fireEvent.error($tab(1).querySelector('img.vertical-tab__icon'));
      // Then
      await waitFor(() => expect($tab(1).querySelector('.vertical-tab__icon--placeholder').textContent).toBe('o'));
    });
    test.each([
      [1, 'https://one.com'],
      [2, 'Two'],
      [3, 'my service']
    ])('tab %s has "%s" as tooltip', (id, expected) => {
      expect($tab(id).getAttribute('title')).toBe(expected);
    });
    test.each([
      [1, 'https://one.com'],
      [4, '(3) Four, 3 unread, notifications off']
    ])('tab %s has "%s" as accessible name', (id, expected) => {
      expect($tab(id).getAttribute('aria-label')).toBe(expected);
    });
    test('shows the notifications muted icon', () => {
      expect($tab(4).querySelector('.vertical-tab__notifications-mute')).not.toBeNull();
    });
    test('shows the unread count parsed from the title', () => {
      expect($tab(4).querySelector('.vertical-tab__badge').textContent).toBe('3');
    });
    test('without unread count in the title, shows no badge', () => {
      expect($tab(2).querySelector('.vertical-tab__badge')).toBeNull();
    });
    test.each([
      ['(0) WhatsApp', null],
      ['(12) WhatsApp', '12'],
      ['(100) Chat', '99+'],
      ['Budget (2024) - Docs', null]
    ])('setServiceTitle "%s", shows badge %s', async (title, expected) => {
      // When
      electron.ipcRenderer.emit('setServiceTitle', {}, {id: 2, title});
      await waitFor(() => expect($tab(2).getAttribute('title')).toBe(title));
      // Then
      expect($tab(2).querySelector('.vertical-tab__badge')?.textContent ?? null).toBe(expected);
    });
    test('setServiceFavicon, updates the icon', async () => {
      // When
      electron.ipcRenderer.emit('setServiceFavicon', {}, {id: 3, favicon: 'https://three.com/new.png'});
      // Then
      await waitFor(() => expect($tab(3).querySelector('img.vertical-tab__icon').getAttribute('src'))
        .toBe('https://three.com/new.png'));
    });
    describe('reorder', () => {
      let servicesReorder;
      const order = () => [...$tabContainer.querySelectorAll('.vertical-tab')].map(e => e.dataset.tabId);
      beforeEach(() => {
        servicesReorder = jest.fn();
        electron.ipcMain.on('servicesReorder', servicesReorder);
      });
      describe('dragging a service over another one', () => {
        beforeEach(async () => {
          fireEvent.dragStart($tab(1), {dataTransfer: {}});
          await waitFor(() => expect($tab(1).classList).toContain('vertical-tab--dragging'));
          fireEvent.dragOver($tab(3));
          await waitFor(() => expect(order()).toEqual(['2', '3', '1', '4']));
        });
        test('persists the new order', () => {
          expect(servicesReorder).toHaveBeenLastCalledWith({tabIds: [2, 3, 1, 4]});
        });
        test('drop ends the drag', async () => {
          // When
          fireEvent.dragEnd($tab(1));
          // Then
          await waitFor(() => expect($tab(1).classList).not.toContain('vertical-tab--dragging'));
        });
      });
      test('dragging something else (e.g. a file) over a service, does nothing', () => {
        // When
        fireEvent.dragOver($tab(3));
        // Then
        expect(servicesReorder).not.toHaveBeenCalled();
      });
      describe('Alt+ArrowDown on a focused service', () => {
        beforeEach(async () => {
          $tab(1).focus();
          fireEvent.keyDown($tab(1), {key: 'ArrowDown', altKey: true});
          await waitFor(() => expect(order()).toEqual(['2', '1', '3', '4']));
        });
        test('persists the new order', () => {
          expect(servicesReorder).toHaveBeenLastCalledWith({tabIds: [2, 1, 3, 4]});
        });
        test('keeps the focus on the moved service', async () => {
          await waitFor(() => expect(document.activeElement).toBe($tab(1)));
        });
      });
      test.each([
        ['Alt+ArrowUp on the first service', 1, {key: 'ArrowUp', altKey: true}],
        ['Alt+ArrowDown on the last service', 4, {key: 'ArrowDown', altKey: true}],
        ['ArrowDown without Alt', 1, {key: 'ArrowDown'}]
      ])('%s, does nothing', (_description, id, key) => {
        // When
        fireEvent.keyDown($tab(id), key);
        // Then
        expect(servicesReorder).not.toHaveBeenCalled();
      });
    });
    describe('click on inactive service', () => {
      let activateService;
      beforeEach(async () => {
        activateService = jest.fn();
        electron.ipcMain.on('activateService', activateService);
        fireEvent.click($tab(3));
        await waitFor(() => expect($tab(3).classList).toContain('vertical-tab--active'));
      });
      test('activates the service', () => {
        expect(activateService).toHaveBeenCalledWith({id: 3, restoreWindow: true});
      });
      test('deactivates the previous service', () => {
        expect($tab(1).classList).not.toContain('vertical-tab--active');
      });
    });
  });
});
