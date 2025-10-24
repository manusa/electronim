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

describe('CLI module test suite', () => {
  let parseSettingsPath;
  let parseUserData;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.resetModules();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    ({parseSettingsPath, parseUserData} = require('../'));
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('parseSettingsPath', () => {
    test('with no --settings-path flag, should return null', () => {
      // Given
      const args = ['--some-other-flag', 'value'];
      // When
      const result = parseSettingsPath(args);
      // Then
      expect(result).toBeNull();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('with valid --settings-path, should return the path', () => {
      // Given
      const args = ['--settings-path', '/path/to/settings.json'];
      // When
      const result = parseSettingsPath(args);
      // Then
      expect(result).toBe('/path/to/settings.json');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('with relative --settings-path, should return the path', () => {
      // Given
      const args = ['--settings-path', './settings.json'];
      // When
      const result = parseSettingsPath(args);
      // Then
      expect(result).toBe('./settings.json');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('with --settings-path and other flags, should return the path', () => {
      // Given
      const args = ['--no-sandbox', '--settings-path', '/custom/settings.json', '--disable-gpu'];
      // When
      const result = parseSettingsPath(args);
      // Then
      expect(result).toBe('/custom/settings.json');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('with --settings-path but no value, should return null and log error', () => {
      // Given
      const args = ['--settings-path'];
      // When
      const result = parseSettingsPath(args);
      // Then
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: --settings-path requires a valid file path argument');
    });

    test('with --settings-path followed by another flag, should return null and log error', () => {
      // Given
      const args = ['--settings-path', '--no-sandbox'];
      // When
      const result = parseSettingsPath(args);
      // Then
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: --settings-path requires a valid file path argument');
    });

    test('with --settings-path containing null byte, should return null and log error', () => {
      // Given
      const args = ['--settings-path', '/path/to/\0settings.json'];
      // When
      const result = parseSettingsPath(args);
      // Then
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: --settings-path contains invalid characters');
    });

    test('with empty string after --settings-path, should return null and log error', () => {
      // Given
      const args = ['--settings-path', ''];
      // When
      const result = parseSettingsPath(args);
      // Then
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: --settings-path requires a valid file path argument');
    });

    test('with --settings-path at end of args, should return null and log error', () => {
      // Given
      const args = ['--no-sandbox', '--settings-path'];
      // When
      const result = parseSettingsPath(args);
      // Then
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: --settings-path requires a valid file path argument');
    });

    test('with path containing spaces, should return the path', () => {
      // Given
      const args = ['--settings-path', '/path with spaces/settings.json'];
      // When
      const result = parseSettingsPath(args);
      // Then
      expect(result).toBe('/path with spaces/settings.json');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('with path containing special characters, should return the path', () => {
      // Given
      const args = ['--settings-path', '/path/with-special_chars.123/settings.json'];
      // When
      const result = parseSettingsPath(args);
      // Then
      expect(result).toBe('/path/with-special_chars.123/settings.json');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('parseUserData', () => {
    test('with no --user-data flag, should return null', () => {
      // Given
      const args = ['--some-other-flag', 'value'];
      // When
      const result = parseUserData(args);
      // Then
      expect(result).toBeNull();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('with valid --user-data, should return the path', () => {
      // Given
      const args = ['--user-data', '/path/to/userdata'];
      // When
      const result = parseUserData(args);
      // Then
      expect(result).toBe('/path/to/userdata');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('with relative --user-data, should return the path', () => {
      // Given
      const args = ['--user-data', './userdata'];
      // When
      const result = parseUserData(args);
      // Then
      expect(result).toBe('./userdata');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('with --user-data and other flags, should return the path', () => {
      // Given
      const args = ['--no-sandbox', '--user-data', '/custom/userdata', '--disable-gpu'];
      // When
      const result = parseUserData(args);
      // Then
      expect(result).toBe('/custom/userdata');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('with --user-data but no value, should return null and log error', () => {
      // Given
      const args = ['--user-data'];
      // When
      const result = parseUserData(args);
      // Then
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: --user-data requires a valid directory path argument');
    });

    test('with --user-data followed by another flag, should return null and log error', () => {
      // Given
      const args = ['--user-data', '--no-sandbox'];
      // When
      const result = parseUserData(args);
      // Then
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: --user-data requires a valid directory path argument');
    });

    test('with --user-data containing null byte, should return null and log error', () => {
      // Given
      const args = ['--user-data', '/path/to/\0userdata'];
      // When
      const result = parseUserData(args);
      // Then
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: --user-data contains invalid characters');
    });

    test('with empty string after --user-data, should return null and log error', () => {
      // Given
      const args = ['--user-data', ''];
      // When
      const result = parseUserData(args);
      // Then
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: --user-data requires a valid directory path argument');
    });

    test('with --user-data at end of args, should return null and log error', () => {
      // Given
      const args = ['--no-sandbox', '--user-data'];
      // When
      const result = parseUserData(args);
      // Then
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: --user-data requires a valid directory path argument');
    });

    test('with path containing spaces, should return the path', () => {
      // Given
      const args = ['--user-data', '/path with spaces/userdata'];
      // When
      const result = parseUserData(args);
      // Then
      expect(result).toBe('/path with spaces/userdata');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('with path containing special characters, should return the path', () => {
      // Given
      const args = ['--user-data', '/path/with-special_chars.123/userdata'];
      // When
      const result = parseUserData(args);
      // Then
      expect(result).toBe('/path/with-special_chars.123/userdata');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
