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
const path = require('node:path');

/**
 * Parses command line arguments to extract the custom settings path.
 * Validates that the value after --settings-path is a valid path and not another flag.
 *
 * @param {string[]} args - Command line arguments array
 * @returns {string|null} The settings path if valid, null otherwise
 */
const parseSettingsPath = args => {
  const settingsPathIndex = args.indexOf('--settings-path');
  if (settingsPathIndex === -1) {
    return null;
  }

  const settingsPathValue = args[settingsPathIndex + 1];

  // Validate that there is a value and it's not another flag
  if (!settingsPathValue || settingsPathValue.startsWith('--')) {
    console.error('Error: --settings-path requires a valid file path argument');
    return null;
  }

  // Basic validation: path should not contain null bytes (security)
  if (settingsPathValue.includes('\0')) {
    console.error('Error: --settings-path contains invalid characters');
    return null;
  }

  return settingsPathValue;
};

/**
 * Parses command line arguments to extract the custom user data directory path.
 * Validates that the value after --user-data is a valid path and not another flag.
 *
 * @param {string[]} args - Command line arguments array
 * @returns {string|null} The user data path if valid, null otherwise
 */
const parseUserData = args => {
  const userDataIndex = args.indexOf('--user-data');
  if (userDataIndex === -1) {
    return null;
  }

  const userDataValue = args[userDataIndex + 1];

  // Validate that there is a value and it's not another flag
  if (!userDataValue || userDataValue.startsWith('--')) {
    console.error('Error: --user-data requires a valid directory path argument');
    return null;
  }

  // Basic validation: path should not contain null bytes (security)
  if (userDataValue.includes('\0')) {
    console.error('Error: --user-data contains invalid characters');
    return null;
  }

  return path.resolve(userDataValue);
};

module.exports = {parseSettingsPath, parseUserData};
