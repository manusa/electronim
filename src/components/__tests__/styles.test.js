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
const fs = require('fs');

describe('Styles Module test suite', () => {
  beforeEach(() => {
    jest.resetModules();
  });
  test('bulma, loads stylesheet', async () => {
    // Given
    require('../styles').bulma();
    // When
    window.document.body.innerHTML = '<div />';
    // Then
    await waitFor(() => expect(document.querySelector('link[href*="bulma"]')).not.toBeNull());
    const bulmaCss = fs.readFileSync(
      document.querySelector('link[href*="bulma"]').getAttribute('href'), 'utf8');
    expect(bulmaCss).toContain('.button,.file-cta,.file-name');
  });
  test('chromeTabs, loads stylesheet', async () => {
    // Given
    require('../styles').chromeTabs();
    // When
    window.document.body.innerHTML = '<div />';
    // Then
    await waitFor(() => expect(document.querySelector('link[href*="chrome-tabs.css"]')).not.toBeNull());
    const bulmaCss = fs.readFileSync(
      document.querySelector('link[href*="chrome-tabs.css"]').getAttribute('href'), 'utf8');
    expect(bulmaCss).toContain('.chrome-tabs {');
  });
  test('chromeTabs, loads dark theme stylesheet', async () => {
    // Given
    require('../styles').chromeTabs();
    // When
    window.document.body.innerHTML = '<div />';
    // Then
    await waitFor(() => expect(document.querySelector('link[href*="chrome-tabs-dark-theme.css"]')).not.toBeNull());
    const bulmaCss = fs.readFileSync(
      document.querySelector('link[href*="chrome-tabs-dark-theme.css"]').getAttribute('href'), 'utf8');
    expect(bulmaCss).toContain('.chrome-tabs.chrome-tabs-dark-theme {');
  });
  test('fontAwesome, loads stylesheet', async () => {
    // Given
    require('../styles').fontAwesome();
    // When
    window.document.body.innerHTML = '<div />';
    // Then
    await waitFor(() => expect(document.querySelector('link[href*="fontawesome"]')).not.toBeNull());
    const bulmaCss = fs.readFileSync(
      document.querySelector('link[href*="fontawesome"]').getAttribute('href'), 'utf8');
    expect(bulmaCss).toContain('fa,.fab,.fad,.fal,.far');
  });
});
