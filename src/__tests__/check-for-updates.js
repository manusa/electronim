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

// Store test servers in global scope to ensure cleanup
// even when jest.resetModules() clears the module cache
if (!globalThis.__testHttpServers__) {
  globalThis.__testHttpServers__ = [];
}

/**
 * Creates a test-isolated check-for-updates module with mock HTTP server.
 *
 * This utility function loads the real check-for-updates module and overrides its
 * GitHub releases URL to use a local test HTTP server, ensuring test isolation
 * and preventing actual network requests to external APIs.
 *
 * Server cleanup is handled automatically by setup-jest.js afterEach hook.
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.handler - Custom request handler function(req, res)
 * @param {number} options.status - HTTP status code for the response (default: 302)
 * @param {string} options.location - Location header value for redirect (default: '/releases/tag/v1.33.7')
 * @returns {Promise<Object>} The check-for-updates module configured for testing
 */
const testCheckForUpdates = async ({
  handler,
  status = 302,
  location = '/releases/tag/v1.33.7'
} = {}) => {
  const {createTestServer} = require('./http-server');
  const checkForUpdates = require('../chrome-tabs/check-for-updates');

  const server = await createTestServer({
    handler: handler || ((req, res) => {
      res.writeHead(status, {
        location,
        'Content-Type': 'text/plain'
      });
      res.end();
    })
  });

  checkForUpdates.setUrl({
    githubReleasesLatestUrl: `${server.url}/latest`
  });

  globalThis.__testHttpServers__.push(server);

  return checkForUpdates;
};

module.exports = {testCheckForUpdates};
