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
describe('Common utils test suite', () => {
  let common;
  beforeEach(() => {
    common = require('../common');
  });
  describe('withRelease', () => {
    const metainfo = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<component type="desktop-application">',
      '  <id>com.marcnuri.electronim</id>',
      '</component>',
      ''
    ].join('\n');
    let stamped;
    describe('in metainfo without releases', () => {
      beforeEach(() => {
        stamped = new DOMParser()
          .parseFromString(common.withRelease(metainfo, '1.33.7', '2026-09-21'), 'application/xml');
      });
      test('adds the version', () => {
        expect(stamped.querySelector('releases > release').getAttribute('version')).toBe('1.33.7');
      });
      test('adds the date', () => {
        expect(stamped.querySelector('releases > release').getAttribute('date')).toBe('2026-09-21');
      });
      test('keeps the rest of the metainfo', () => {
        expect(stamped.querySelector('component > id').textContent).toBe('com.marcnuri.electronim');
      });
    });
    describe('in metainfo that was already stamped', () => {
      beforeEach(() => {
        const first = common.withRelease(metainfo, '1.33.7', '2026-09-21');
        stamped = new DOMParser()
          .parseFromString(common.withRelease(first, '1.33.8', '2026-09-22'), 'application/xml');
      });
      test('replaces the release', () => {
        expect(Array.from(stamped.querySelectorAll('release'), release => release.getAttribute('version')))
          .toEqual(['1.33.8']);
      });
    });
  });
});
