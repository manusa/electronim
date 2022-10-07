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
  beforeEach(() => {
    jest.resetModules();
  });
  describe('preload (just for coverage and sanity, see bundle tests)', () => {
    beforeEach(() => {
      jest.mock('../help.browser.css', () => {});
      jest.mock('!val-loader!./docs.browser.val-loader', () => ({
        docs: {
          one: 'this is a doc'
        }
      }), {virtual: true});
      require('../preload');
    });
    test('adds required variables', () => {
      expect(window.docs).toEqual({one: 'this is a doc'});
    });
  });
  describe('preload.bundle', () => {
    beforeEach(() => {
      require('../../../bundles/help.preload');
    });
    test('loads styles in order', async () => {
      // When
      document.body.append(document.createElement('div'));
      // Then
      await waitFor(() => expect(document.head.children.length).toBeGreaterThan(0));
      const styles = Array.from(document.querySelectorAll('style'));
      expect(styles).toHaveLength(9);
      expect(styles[0].innerHTML).toMatch(/:root \{.+--color-accent-fg:/s); // Variables
      expect(styles[1].innerHTML).toContain('html.electronim,'); // Base
      expect(styles[2].innerHTML).toContain('.electronim h1,'); // Typography
      expect(styles[4].innerHTML).toContain('.electronim .control .checkbox {'); // CheckBox
      expect(styles[5].innerHTML).toContain('.electronim .top-bar.navbar {'); // NavBar
      expect(styles[8].innerHTML).toContain('.help-root {'); // Help-specific
    });
    test('loads document contents with valid asset URLs', () => {
      expect(window.docs).toEqual(expect.objectContaining({
        'Keyboard-shortcuts.md': expect.stringMatching(/<h1>Keyboard Shortcuts/i),
        'Roadmap.md': expect.any(String),
        'Screenshots.md': expect.stringContaining('<img src="../../docs/screenshots/main.png" alt="Main" />'),
        'Setup.md': expect.stringMatching(/There are several options available/i),
        'Troubleshooting.md': expect.any(String)
      }));
    });
  });
});
