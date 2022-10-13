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

import {fileURLToPath} from 'url';
import {dirname, resolve} from 'path';
import {readFileSync} from 'fs';

const parser = new DOMParser();

export const loadDOM = async ({meta, path}) => {
  const pathSegments = [dirname(fileURLToPath(meta.url)), ...path];
  const htmlPath = resolve(...pathSegments);
  const html = readFileSync(htmlPath, 'utf8');
  const index = parser.parseFromString(html, 'text/html');
  document.head.innerHTML = index.head.innerHTML;
  document.body.innerHTML = index.body.innerHTML;
  for (const script of index.querySelectorAll('script[src]')) {
    await import(`${dirname(htmlPath)}/${script.getAttribute('src')}`);
  }
};
