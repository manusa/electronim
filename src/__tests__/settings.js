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

/**
 * Creates a test-isolated settings module with temporary directory overrides.
 *
 * This utility function loads the real settings module and overrides its
 * directory paths to use a temporary directory, ensuring test isolation
 * and preventing test interference with actual user settings.
 *
 * @returns {Promise<Object>} The settings module with overridden paths
 */
const testSettings = async () => {
  const path = require('node:path');
  const os = require('node:os');
  const fs = require('node:fs');
  const settings = require('../settings');
  settings.paths.appDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'electronim-test-'));
  settings.paths.settingsPath = path.join(settings.paths.appDir, 'settings.json');
  return settings;
};

module.exports = {testSettings};
