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
const fs = require('node:fs');
const path = require('node:path');

// Helper function to parse the module.exports output from val-loader
const parseValLoaderOutput = code => {
  // Extract the JSON object from the code string
  // The code is in format: module.exports = {docs: {...}};
  const prefix = 'module.exports = {docs: ';
  const suffix = '};';

  if (!code.startsWith(prefix) || !code.endsWith(suffix)) {
    throw new Error('Invalid val-loader output format');
  }

  const jsonStr = code.substring(prefix.length, code.length - suffix.length);
  return {docs: JSON.parse(jsonStr)};
};

describe('docs.browser.val-loader test suite', () => {
  let valLoader;
  const DOCS_DIR = path.resolve(__dirname, '..', '..', '..', 'docs');

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
      expect(result.code).toMatch(/^module\.exports = \{docs: .+\};$/);
    });
  });

  describe('loads actual documentation files', () => {
    let docsObject;

    beforeEach(() => {
      valLoader = require('../docs.browser.val-loader.js');
      const result = valLoader();
      docsObject = parseValLoaderOutput(result.code);
    });

    test('loads all markdown files from docs directory', () => {
      expect(docsObject.docs).toBeDefined();
      expect(Object.keys(docsObject.docs).length).toBeGreaterThan(0);

      // Verify all loaded files end with .md
      Object.keys(docsObject.docs).forEach(fileName => {
        expect(fileName).toMatch(/\.md$/);
      });
    });

    test('only loads .md files', () => {
      // Get actual files from docs directory
      const actualFiles = fs.readdirSync(DOCS_DIR);
      const markdownFiles = actualFiles.filter(f => f.endsWith('.md'));
      const nonMarkdownFiles = actualFiles.filter(f => !f.endsWith('.md') && !fs.statSync(path.join(DOCS_DIR, f)).isDirectory());

      // All markdown files should be loaded
      markdownFiles.forEach(file => {
        expect(docsObject.docs[file]).toBeDefined();
      });

      // Non-markdown files should not be loaded
      nonMarkdownFiles.forEach(file => {
        expect(docsObject.docs[file]).toBeUndefined();
      });
    });

    test('converts markdown to HTML', () => {
      Object.entries(docsObject.docs).forEach(([, html]) => {
        expect(html).toBeDefined();
        expect(typeof html).toBe('string');
        // All markdown files start with # heading, so HTML should contain h1 tags
        expect(html).toContain('<h1');
        expect(html).toContain('</h1>');
      });
    });

    test('renders XHTML-compliant output with self-closing tags', () => {
      // At least one doc should have self-closing tags (e.g., <br />)
      const allHtml = Object.values(docsObject.docs).join('');
      expect(allHtml).toContain('<br />');
    });

    test('prefixes relative URLs with ../../docs/', () => {
      Object.entries(docsObject.docs).forEach(([, html]) => {
        const srcMatches = html.match(/src="([^"]+)"/g) || [];
        const hrefMatches = html.match(/href="([^"]+)"/g) || [];

        [...srcMatches, ...hrefMatches].forEach(attr => {
          // Either absolute URL or prefixed with ../../docs/
          // eslint-disable-next-line no-div-regex
          expect(attr).toMatch(/="(https?:\/\/|\.\.\/\.\.\/docs\/)/);
        });
      });
    });

    test('does not modify absolute URLs', () => {
      const allHtml = Object.values(docsObject.docs).join('');
      const absoluteUrls = allHtml.match(/https?:\/\/[^"'\s]+/g) || [];

      absoluteUrls.forEach(url => {
        expect(url).not.toContain('../../docs/http');
      });
    });
  });
});
