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
const mockDOM = () => {
  document.body.innerHTML = '';
  const $root = document.createElement('div');
  $root.innerHTML = `
    <div class="settings">
        <form class="form">
            <input class="settings__new-tab" />
            <div class="settings__tabs"></div>
            <div class="settings__dictionaries"></div>
            <button class="settings__submit" />
            <button class="settings__cancel" />
        </form>
    </div>
    `;
  document.body.append($root);
};

describe('Settings in Browser test suite', () => {
  let mockDictionaries;
  let mockTabs;
  let mockIpcRenderer;
  beforeEach(() => {
    mockDictionaries = {available: {
      en: {name: 'English'},
      es: {name: 'Spanish'}
    }, enabled: []};
    mockTabs = [
      {url: 'https://initial-tab.com'}
    ];
    mockIpcRenderer = {
      send: jest.fn()
    };
    window.APP_EVENTS = {};
    window.dictionaries = mockDictionaries;
    window.tabs = mockTabs;
    window.ipcRenderer = mockIpcRenderer;
    mockDOM();
    jest.isolateModules(() => {
      require('../browser-settings');
    });
  });
  test('Form submit on enter is prevented', () => {
    // Given
    const event = new Event('keypress');
    event.code = 'Enter';
    event.preventDefault = jest.fn();
    // When
    document.querySelector('.settings .form').dispatchEvent(event);
    // Then
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });
  describe('Button events', () => {
    test('Submit should send form data', () => {
      // Given
      window.APP_EVENTS = {settingsSave: 'Save my settings'};
      // When
      document.querySelector('.settings__submit').dispatchEvent(new Event('click'));
      // Then
      expect(mockIpcRenderer.send).toHaveBeenCalledTimes(1);
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('Save my settings',
        {tabs: ['https://initial-tab.com'], dictionaries: []});
    });
    test('Cancel should send cancel event', () => {
      // Given
      window.APP_EVENTS = {settingsCancel: 'Cancel my settings'};
      // When
      document.querySelector('.settings__cancel').dispatchEvent(new Event('click'));
      // Then
      expect(mockIpcRenderer.send).toHaveBeenCalledTimes(1);
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('Cancel my settings');
    });
  });
  describe('New tab field', () => {
    let $input;
    beforeEach(() => {
      $input = document.querySelector('.settings__new-tab');
    });
    test('Regular key press (No Enter), should only update input value', () => {
      // Given
      const event = new Event('keypress');
      event.code = 'A';
      event.preventDefault = jest.fn();
      // When
      $input.dispatchEvent(event);
      // Then
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
    describe('Enter key with URLS', () => {
      let event;
      beforeEach(() => {
        event = new Event('keypress');
        event.code = 'Enter';
        event.preventDefault = jest.fn();
      });
      test('Empty URL, should do nothing', () => {
        // Given
        $input.value = '';
        // When
        $input.dispatchEvent(event);
        // Then
        expect(event.preventDefault).not.toHaveBeenCalled();
      });
      test('Invalid URL, should do nothing', () => {
        // Given
        $input.value = 'invalid:1337:url';
        // When
        $input.dispatchEvent(event);
        // Then
        expect(event.preventDefault).not.toHaveBeenCalled();
      });
      test('Valid URL without protocol, should add new url', () => {
        // Given
        $input.value = 'info.cern.ch';
        // When
        $input.dispatchEvent(event);
        // Then
        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(document.querySelector('.settings__tabs').innerHTML).toContain('https://info.cern.ch');
        expect($input.value).toBe('');
        expect(document.querySelector('.settings__submit').getAttribute('disabled')).toBeNull();
      });
      test('Valid URL wth protocol, should add new url', () => {
        // Given
        $input.value = 'http://info.cern.ch';
        // When
        $input.dispatchEvent(event);
        // Then
        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(document.querySelector('.settings__tabs').innerHTML).toContain('http://info.cern.ch');
        expect($input.value).toBe('');
        expect(document.querySelector('.settings__submit').getAttribute('disabled')).toBeNull();
      });
    });
    describe('input event', () => {
      let event;
      beforeEach(() => {
        event = new Event('input');
      });
      test('Valid URL, should add success class', () => {
        // Given
        $input.value = 'http://info.cern.ch';
        // When
        $input.dispatchEvent(event);
        // Then
        expect($input.classList.contains('is-success')).toBe(true);
        expect($input.classList.contains('is-danger')).toBe(false);
      });
      test('Invalid URL, should add danger class', () => {
        // Given
        $input.value = 'http://invalid:1337:url';
        // When
        $input.dispatchEvent(event);
        // Then
        expect($input.classList.contains('is-danger')).toBe(true);
        expect($input.classList.contains('is-success')).toBe(false);
      });
    });
  });
  describe('Tab events', () => {
    test('Icon click, should remove tab', () => {
      // Given
      const $tabs = document.querySelector('.settings__tabs');
      expect($tabs.childElementCount).toBe(1);
      const $icon = $tabs.querySelector('.icon');
      // When
      $icon.dispatchEvent(new Event('click'));
      // Then
      expect($tabs.childElementCount).toBe(0);
    });
  });
});
