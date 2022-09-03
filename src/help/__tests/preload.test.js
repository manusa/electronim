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
const {waitFor} = require('@testing-library/dom');

describe('Help Module preload test suite', () => {
  let mockHelp;
  beforeEach(() => {
    mockHelp = {loadDocs: jest.fn()};
    jest.resetModules();
    jest.mock('../../main/preload', () => {
      global.mainPreloadLoaded = true;
    });
    jest.mock('../', () => mockHelp);
  });
  test('preload', () => {
    // When
    require('../preload');
    // Then
    expect(global.mainPreloadLoaded).toBe(true);
    expect(mockHelp.loadDocs).toHaveBeenCalledTimes(1);
  });
  test('bulma is loaded', async () => {
    // When
    require('../preload');
    // Then
    await waitFor(() => expect(document.querySelector('link[href*="bulma"]')).not.toBeNull());
  });
  test('fontawesome is loaded', async () => {
    // When
    require('../preload');
    // Then
    await waitFor(() => expect(document.querySelector('link[href*="fontawesome"]')).not.toBeNull());
  });
  test('browser-help is loaded', async () => {
    // When
    require('../preload');
    // Then
    await waitFor(() => expect(document.querySelector('link[href*="browser-help"]')).not.toBeNull());
  });
});
