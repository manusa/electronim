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
const path = require('path');
const DOCS_DIR = path.resolve(__dirname, '../../../docs');
describe('Help module test suite', () => {
  let help;
  beforeEach(() => {
    help = require('../');
  });
  describe('fixRelative', () => {
    test('Complex', () => {
      // Given
      const input = `
        <img src\t   =  'relativePath'/>
        <img src="https://absolute.com" /><a href="./relativeDir" />
        <a href="http://test/some-path" />
      `;
      // When
      const result = help.fixRelative(input);
      // Then
      expect(result).toBe(`
        <img src	   =  '${DOCS_DIR}/relativePath'/>
        <img src="https://absolute.com" /><a href="${DOCS_DIR}/./relativeDir" />
        <a href="http://test/some-path" />
      `);
    });
  });
});

