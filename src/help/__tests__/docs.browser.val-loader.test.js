/**
 * @jest-environment node
 */
/*
   Copyright 2025 Marc Nuri San Felix

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
// Helper function to parse the module.exports output from val-loader
const parseValLoaderOutput = code => {
  // The val-loader outputs code like: module.exports = {docs: ..., metadata: ...};
  // We need to execute it and return the exports
  const module = {exports: {}};
  // eslint-disable-next-line no-new-func
  const fn = new Function('module', 'exports', `${code}; return module.exports;`); // NOSONAR
  return fn(module, module.exports);
};

describe('docs.browser.val-loader test suite', () => {
  let valLoader;

  beforeEach(() => {
    jest.resetModules();
  });

  describe('val-loader function', () => {
    let result;

    beforeEach(() => {
      valLoader = require('../docs.browser.val-loader.js');
      result = valLoader();
    });

    test('returns an object with cacheable and code properties', () => {
      expect(result).toBeDefined();
      expect(result).toHaveProperty('cacheable');
      expect(result).toHaveProperty('code');
    });

    test('cacheable is set to true', () => {
      expect(result.cacheable).toBe(true);
    });

    test('code is a valid module.exports string', () => {
      expect(result.code).toMatch(/^module\.exports = {docs: .+, metadata: .+};$/);
    });
  });

  describe('loads actual documentation files', () => {
    let result;

    beforeEach(() => {
      valLoader = require('../docs.browser.val-loader.js');
      const loaderResult = valLoader();
      result = parseValLoaderOutput(loaderResult.code);
    });

    test('loads documentation files in specified order', () => {
      expect(result.docs).toBeDefined();
      expect(Object.keys(result.docs).length).toBeGreaterThan(0);

      // Verify all loaded files end with .md
      Object.keys(result.docs).forEach(fileName => {
        expect(fileName).toMatch(/\.md$/);
      });

      // Verify specific documents are loaded (from DOCUMENT_ORDER)
      expect(result.docs['Setup.md']).toBeDefined();
      expect(result.docs['Keyboard-shortcuts.md']).toBeDefined();
      expect(result.docs['Troubleshooting.md']).toBeDefined();
    });

    test('only loads specified markdown files', () => {
      // Only files in DOCUMENT_ORDER should be loaded
      const expectedFiles = ['Setup.md', 'Keyboard-shortcuts.md', 'Troubleshooting.md'];
      const loadedFiles = Object.keys(result.docs);

      expectedFiles.forEach(file => {
        expect(loadedFiles).toContain(file);
      });

      // Should not load files not in DOCUMENT_ORDER (like Screenshots.md or Roadmap.md)
      expect(result.docs['Screenshots.md']).toBeUndefined();
      expect(result.docs['Roadmap.md']).toBeUndefined();
    });

    test('converts markdown to HTML', () => {
      Object.entries(result.docs).forEach(([, html]) => {
        expect(html).toBeDefined();
        expect(typeof html).toBe('string');
        // All markdown files start with # heading, so HTML should contain h1 tags
        expect(html).toContain('<h1');
        expect(html).toContain('</h1>');
      });
    });

    test('adds IDs to headings for anchor navigation', () => {
      // Check that h1 and h2 elements have id attributes
      Object.entries(result.docs).forEach(([fileName, html]) => {
        const h1Match = html.match(/<h1 id="([^"]+)">/);
        expect(h1Match).not.toBeNull();
        expect(h1Match[1]).toBe(fileName); // H1 should have document filename as ID

        // If there are h2 elements, they should have IDs too
        const h2Matches = html.match(/<h2 id="[^"]+">/g);
        if (h2Matches) {
          h2Matches.forEach(h2Tag => {
            expect(h2Tag).toMatch(new RegExp(`<h2 id="${fileName}__[^"]+">`, 'g'));
          });
        }
      });
    });

    test('renders XHTML-compliant output with self-closing tags', () => {
      // At least one doc should have self-closing tags (e.g., <br />)
      const allHtml = Object.values(result.docs).join('');
      expect(allHtml).toContain('<br />');
    });

    test('prefixes relative URLs with ../../docs/', () => {
      Object.entries(result.docs).forEach(([, html]) => {
        const srcMatches = html.match(/src="([^"]+)"/g) || [];
        const hrefMatches = html.match(/href="([^"]+)"/g) || [];

        [...srcMatches, ...hrefMatches].forEach(attr => {
          // Either absolute URL or prefixed with ../../docs/ or is an anchor link
          // eslint-disable-next-line no-div-regex
          expect(attr).toMatch(/="(https?:\/\/|\.\.\/\.\.\/docs\/|#)/);
        });
      });
    });

    test('does not modify absolute URLs', () => {
      const allHtml = Object.values(result.docs).join('');
      const absoluteUrls = allHtml.match(/https?:\/\/[^"'\s]+/g) || [];

      absoluteUrls.forEach(url => {
        expect(url).not.toContain('../../docs/http');
      });
    });
  });

  describe('metadata extraction', () => {
    let result;

    beforeEach(() => {
      valLoader = require('../docs.browser.val-loader.js');
      const loaderResult = valLoader();
      result = parseValLoaderOutput(loaderResult.code);
    });

    test('extracts metadata for all documents', () => {
      expect(result.metadata).toBeDefined();
      expect(Array.isArray(result.metadata)).toBe(true);
      expect(result.metadata.length).toBe(3); // Setup, Keyboard-shortcuts, Troubleshooting
    });

    test('metadata contains document id and title', () => {
      result.metadata.forEach(meta => {
        expect(meta).toHaveProperty('id');
        expect(meta).toHaveProperty('title');
        expect(meta).toHaveProperty('headings');
        expect(meta.id).toMatch(/\.md$/);
        expect(typeof meta.title).toBe('string');
        expect(Array.isArray(meta.headings)).toBe(true);
      });
    });

    test('metadata is in correct order', () => {
      expect(result.metadata[0].id).toBe('Setup.md');
      expect(result.metadata[1].id).toBe('Keyboard-shortcuts.md');
      expect(result.metadata[2].id).toBe('Troubleshooting.md');
    });

    test('metadata titles match H1 headings', () => {
      expect(result.metadata[0].title).toBe('Setup');
      expect(result.metadata[1].title).toBe('Keyboard Shortcuts');
      expect(result.metadata[2].title).toBe('Troubleshooting');
    });

    test('metadata headings contain H2 elements with text and id', () => {
      result.metadata.forEach(meta => {
        meta.headings.forEach(heading => {
          expect(heading).toHaveProperty('level');
          expect(heading).toHaveProperty('text');
          expect(heading).toHaveProperty('id');
          expect(heading.level).toBe(2);
          expect(typeof heading.text).toBe('string');
          expect(typeof heading.id).toBe('string');
        });
      });
    });

    test('Setup.md has expected H2 headings', () => {
      const setupMeta = result.metadata.find(m => m.id === 'Setup.md');
      expect(setupMeta.headings.length).toBeGreaterThan(0);

      const headingTexts = setupMeta.headings.map(h => h.text);
      expect(headingTexts).toContain('Install');
      expect(headingTexts).toContain('Settings');
    });
  });
});
