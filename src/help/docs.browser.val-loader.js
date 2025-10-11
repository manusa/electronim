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

const fixRelativeUrls = s => s.replaceAll(
  /((src|href)\s*?=\s*?['"](?!http))([^'"]+)(['"])/gi,
  `$1${DOCS_DIR_RELATIVE}/$3$4`
);

const loadDocs = () => fs.readdirSync(DOCS_DIR)
  .filter(fileName => fileName.endsWith('.md'))
  .reduce((acc, fileName) => {
    acc[fileName] = fixRelativeUrls(md.render(fs.readFileSync(path.resolve(DOCS_DIR, fileName), 'utf8')));
    return acc;
  }, {});

module.exports = () => ({
  cacheable: true,
  code: `module.exports = {docs: ${JSON.stringify(loadDocs())}};`
});
