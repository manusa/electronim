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

// Store test servers created during tests in global scope
// to ensure cleanup even when jest.resetModules() clears the module cache
if (!globalThis.__testUpdateServers__) {
  globalThis.__testUpdateServers__ = [];
}

/**
 * Creates a test-isolated update module with a test HTTP server.
 *
 * This utility function creates a local HTTP server that simulates GitHub's
 * release redirect behavior, loads the real update module, and configures it
 * to use the test server. This ensures test isolation and prevents real
 * network calls during tests.
 *
 * @returns {Promise<Object>} The update module configured with a test server
 */
const testUpdate = async () => {
  const {createTestServer} = require('./http-server');
  const update = require('../update');

  const server = await createTestServer({
    handler: (req, res) => {
      res.writeHead(302, {
        location: 'https://github.com/manusa/electronim/releases/tag/v999.999.999',
        'Content-Type': 'text/plain'
      });
      res.end();
    }
  });

  update.setUrl({githubReleasesLatestUrl: `${server.url}/latest`});
  globalThis.__testUpdateServers__.push(server);

  return update;
};

module.exports = {testUpdate};
