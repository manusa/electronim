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
import {describe, expect, test, beforeEach} from '@jest/globals';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';
import {readFileSync} from 'node:fs';

describe('Task Manager index.html test suite', () => {
  let parser;
  let doc;

  beforeEach(() => {
    const pathSegments = [dirname(fileURLToPath(import.meta.url)), '..', 'index.html'];
    const htmlPath = resolve(...pathSegments);
    const html = readFileSync(htmlPath, 'utf8');
    parser = new DOMParser();
    doc = parser.parseFromString(html, 'text/html');
  });

  test('loads required styles', () => {
    const cssLinks = doc.querySelectorAll('link[rel="stylesheet"]');

    expect(cssLinks.length).toBe(1);
    expect(cssLinks[0].href).toContain('task-manager.browser.css');
  });

  test('loads task manager script', () => {
    const scripts = doc.querySelectorAll('script[type="module"]');

    expect(scripts.length).toBe(1);
    expect(scripts[0].src).toContain('task-manager.browser.mjs');
  });

  test('has task manager root element', () => {
    const root = doc.querySelector('.task-manager-root');

    expect(root).toBeTruthy();
  });

  test('has proper Content Security Policy', () => {
    const cspMeta = doc.querySelector('meta[http-equiv="Content-Security-Policy"]');

    expect(cspMeta).toBeTruthy();
    expect(cspMeta.content).toContain("script-src 'self'");
  });
});
