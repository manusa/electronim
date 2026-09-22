/*
   Copyright 2026 Marc Nuri San Felix

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

describe('Package desktop entry test suite', () => {
  let packageJson;
  let entry;
  beforeEach(() => {
    packageJson = require('../../package.json');
    entry = Object.fromEntries(fs.readFileSync(path.resolve(__dirname, '..', 'electronim.package.desktop'), 'utf8')
      .split('\n')
      .filter(line => line.includes('=') && !line.startsWith('#'))
      .map(line => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]));
  });
  test('has the product name as its name', () => {
    expect(entry.Name).toBe(packageJson.build.productName);
  });
  test('runs the executable electron-builder generates', () => {
    // Unlike the RPM entry, the packages this one ships in have no fixed installation directory
    expect(entry.Exec).toBe(`${packageJson.build.linux.executableName} %U`);
  });
  test('uses the icon name electron-builder installs', () => {
    expect(entry.Icon).toBe(packageJson.build.linux.executableName);
  });
  test('has the categories of the generated entry', () => {
    expect(entry.Categories).toBe(packageJson.build.linux.category);
  });
  test('has the package description as its comment', () => {
    expect(entry.Comment).toBe(packageJson.description);
  });
  test('associates the window with the entry', () => {
    expect(entry.StartupWMClass).toBe(packageJson.build.productName);
  });
  test('has the type of the generated entry', () => {
    expect(entry.Type).toBe(packageJson.build.linux.desktop.entry.Type);
  });
  test('has the terminal flag of the generated entry', () => {
    expect(entry.Terminal).toBe(packageJson.build.linux.desktop.entry.Terminal);
  });
});
