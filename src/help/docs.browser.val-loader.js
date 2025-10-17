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
const fs = require('node:fs');
const path = require('node:path');
const md = require('markdown-it')({html: true, xhtmlOut: true}); // NOSONAR

const DOCS_DIR = path.resolve(__dirname, '..', '..', 'docs');
// Should be a relative path from the src/help directory (or wherever index.html is located)
const DOCS_DIR_RELATIVE = '../../docs';

// Define the order and which documents to include in the help page
const DOCUMENT_ORDER = [
  'Setup.md',
  'Keyboard-shortcuts.md',
  'Troubleshooting.md'
];

const fixRelativeUrls = s => s.replaceAll(
  /((src|href)\s*?=\s*?['"](?!http))([^'"]+)(['"])/gi,
  `$1${DOCS_DIR_RELATIVE}/$3$4`
);

/**
 * Generate a URL-friendly ID from heading text
 * @param {string} text - Heading text
 * @returns {string} URL-friendly ID
 */
const generateId = text => text.toLowerCase()
  .replaceAll(/[^\w\s-]/g, '')
  .replaceAll(/\s+/g, '-')
  .replaceAll(/-+/g, '-')
  .trim();

/**
 * Extract headings from markdown content to build table of contents
 * @param {string} content - Raw markdown content
 * @returns {Array} Array of heading objects with level, text, and id
 */
const extractHeadings = content => {
  const headingRegex = /^(#{1,2})\s+(.+)$/gm; // NOSONAR
  const headings = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = generateId(text);

    headings.push({level, text, id});
  }

  return headings;
};

/**
 * Add IDs to heading elements in rendered HTML
 * @param {string} html - Rendered HTML content
 * @param {string} docId - Document ID for unique anchors
 * @returns {string} HTML with IDs added to headings
 */
const addHeadingIds = (html, docId) => {
  // Use [^<]+ instead of .+? to prevent backtracking issues (heading text cannot contain <)
  return html.replaceAll(/<h([12])>([^<]+)<\/h\1>/g, (match, level, text) => {
    const id = generateId(text);
    const fullId = level === '1' ? docId : `${docId}__${id}`;
    return `<h${level} id="${fullId}">${text}</h${level}>`;
  });
};

/**
 * Load documents and extract their metadata
 */
const loadDocs = () => {
  const docs = {};
  const metadata = [];

  for (const fileName of DOCUMENT_ORDER) {
    const filePath = path.resolve(DOCS_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: Document ${fileName} not found`);
      continue;
    }

    const rawContent = fs.readFileSync(filePath, 'utf8');
    const headings = extractHeadings(rawContent);
    let renderedContent = md.render(rawContent);
    renderedContent = addHeadingIds(renderedContent, fileName);
    renderedContent = fixRelativeUrls(renderedContent);

    docs[fileName] = renderedContent;

    // Extract the main title (first H1) for the ToC
    const mainHeading = headings.find(h => h.level === 1);

    if (mainHeading) {
      metadata.push({
        id: fileName,
        title: mainHeading.text,
        headings: headings.filter(h => h.level === 2) // Only include H2 for sub-items
      });
    }
  }

  return {docs, metadata};
};

module.exports = function docsValLoader() {
  const {docs, metadata} = loadDocs();
  return {
    cacheable: true,
    code: `module.exports = {docs: ${JSON.stringify(docs)}, metadata: ${JSON.stringify(metadata)}};`
  };
};
