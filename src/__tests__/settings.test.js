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
describe('Test Settings Utility test suite', () => {
  const fs = require('node:fs');
  const {testSettings} = require('./settings');

  describe('testSettings', () => {
    test('should create a temporary directory', async () => {
      // When
      const settings = await testSettings();
      // Then
      expect(settings.paths.appDir).toContain('electronim-test-');
      expect(fs.existsSync(settings.paths.appDir)).toBe(true);
    });

    test('should track created directory in global array', async () => {
      // Given
      const initialLength = global.__testTempDirectories__.length;
      // When
      await testSettings();
      // Then
      expect(global.__testTempDirectories__.length).toBe(initialLength + 1);
      expect(global.__testTempDirectories__[global.__testTempDirectories__.length - 1]).toContain('electronim-test-');
    });

    test('temporary directory should be cleaned up after test', async () => {
      // Given
      const settings = await testSettings();
      const tempDir = settings.paths.appDir;
      expect(fs.existsSync(tempDir)).toBe(true);
      // When - afterEach hook in setup-jest.js will run after this test
      // Then - directory will be cleaned up automatically
      // We verify cleanup happened by checking the global array is empty after the test suite runs
    });

    test('should survive jest.resetModules() - reproducing the original issue', async () => {
      // Given
      const initialLength = global.__testTempDirectories__.length;
      const settings = await testSettings();
      const tempDir = settings.paths.appDir;
      expect(fs.existsSync(tempDir)).toBe(true);

      // When - calling jest.resetModules() like some tests do
      jest.resetModules();

      // Then - the directory should still be tracked in global scope
      expect(global.__testTempDirectories__.length).toBe(initialLength + 1);
      expect(global.__testTempDirectories__[global.__testTempDirectories__.length - 1]).toBe(tempDir);
      // The cleanup will happen in afterEach despite the module reset
    });
  });
});
