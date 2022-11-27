/*
   Copyright 2022 Marc Nuri San Felix

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

export const ipcRenderer = () => {
  const mockDictionariesAvailableNative = ['en'];
  const mockDictionariesAvailable = {
    en: {name: 'English'},
    es: {name: 'Spanish'}
  };
  const mockDictionariesEnabled = ['en'];
  const mockCurrentSettings = {
    disableNotificationsGlobally: false,
    tabs: [
      {id: '1', url: 'https://initial-tab.com', sandboxed: true},
      {id: '2', url: 'https://initial-tab-2.com', disabled: true, disableNotifications: true}
    ],
    theme: 'dark',
    trayEnabled: true
  };
  return {
    mockDictionariesAvailableNative,
    mockDictionariesAvailable,
    mockDictionariesEnabled,
    mockCurrentSettings,
    send: jest.fn(),
    invoke: jest.fn(async channel => {
      switch (channel) {
        case 'settingsLoad':
          return mockCurrentSettings;
        case 'dictionaryGetAvailableNative':
          return mockDictionariesAvailableNative;
        case 'dictionaryGetAvailable':
          return mockDictionariesAvailable;
        case 'dictionaryGetEnabled':
          return mockDictionariesEnabled;
        default:
          return {};
      }
    })
  };
};
