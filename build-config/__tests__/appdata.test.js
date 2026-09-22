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

describe('AppStream metainfo test suite', () => {
  const projectRoot = path.resolve(__dirname, '..', '..');
  let packageJson;
  let metainfo;
  beforeEach(() => {
    packageJson = require('../../package.json');
    const xml = fs.readFileSync(path.resolve(__dirname, '..', `${packageJson.build.appId}.appdata.xml`), 'utf8');
    metainfo = new DOMParser().parseFromString(xml, 'application/xml');
  });
  test('is well-formed XML', () => {
    expect(metainfo.querySelector('parsererror')).toBeNull();
  });
  test('describes a desktop application', () => {
    expect(metainfo.documentElement.getAttribute('type')).toBe('desktop-application');
  });
  test('has the electron-builder appId as its id', () => {
    expect(metainfo.querySelector('component > id').textContent).toBe(packageJson.build.appId);
  });
  test('has the product name as its name', () => {
    expect(metainfo.querySelector('component > name').textContent).toBe(packageJson.build.productName);
  });
  test('has the package license as its project license', () => {
    expect(metainfo.querySelector('project_license').textContent).toBe(packageJson.license);
  });
  test('launches the desktop file electron-builder generates', () => {
    // electron-builder names the desktop file it adds to the AppImage after the executable, as long as
    // the project sets no desktopName to sync it with
    expect(metainfo.querySelector('launchable[type="desktop-id"]').textContent)
      .toBe(`${packageJson.build.linux.executableName}.desktop`);
  });
  test('is installed by electron-builder where AppImage tools look for it', () => {
    // The appimage.github.io catalog only reads the listing data from *.appdata.xml files
    expect(packageJson.build.linux.extraFiles).toContainEqual({
      from: `build-config/${packageJson.build.appId}.appdata.xml`,
      to: `usr/share/metainfo/${packageJson.build.appId}.appdata.xml`
    });
  });
  test('launches a desktop file electron-builder installs where AppStream tools look for it', () => {
    // electron-builder adds its desktop file to the root of the AppImage only, appstreamcli validate-tree
    // (run by the catalog's appdir-lint.sh) looks for the launchable in usr/share/applications
    expect(packageJson.build.linux.extraFiles).toContainEqual({
      from: 'build-config/electronim.package.desktop',
      to: `usr/share/applications/${metainfo.querySelector('launchable[type="desktop-id"]').textContent}`
    });
  });
  test('is installed along files that exist', () => {
    // electron-builder only logs that a file source doesn't exist and carries on
    expect(packageJson.build.linux.extraFiles)
      .toSatisfyAll(({from}) => fs.existsSync(path.resolve(projectRoot, from)));
  });
});
