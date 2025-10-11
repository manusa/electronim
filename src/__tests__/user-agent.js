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

const DEFAULT_CHROMIUM_RESPONSE = {
  releases: [
    {name: 'chrome/platforms/linux/channels/stable/versions/1337/releases/1704308709', version: '1337'}
  ]
};

const DEFAULT_FIREFOX_RESPONSE = {
  LATEST_FIREFOX_VERSION: 'ff.1337',
  FIREFOX_ESR: 'ff.1337.esr'
};

/**
 * Creates a test-isolated user-agent module with mock HTTP server.
 *
 * This utility function loads the real user-agent module and overrides its
 * browser version URLs to use a local test HTTP server, ensuring test isolation
 * and preventing actual network requests to external APIs.
 *
 * Server cleanup is handled automatically by setup-jest.js afterEach hook.
 *
 * @param {Object} options - Configuration options
 * @param {Object} options.chromiumResponse - Response body for chromium endpoint (default: valid releases)
 * @param {Object} options.firefoxResponse - Response body for firefox endpoint (default: valid versions)
 * @param {number} options.chromiumStatus - HTTP status code for chromium endpoint (default: 200)
 * @param {number} options.firefoxStatus - HTTP status code for firefox endpoint (default: 200)
 * @returns {Promise<Object>} The user-agent module configured for testing
 */
const testUserAgent = async ({
  chromiumResponse = DEFAULT_CHROMIUM_RESPONSE,
  firefoxResponse = DEFAULT_FIREFOX_RESPONSE,
  chromiumStatus = 200,
  firefoxStatus = 200
} = {}) => {
  const {createTestServer} = require('./http-server');
  const userAgent = require('../user-agent');

  // Reset browser versions to ensure clean state
  userAgent.BROWSER_VERSIONS.chromium = null;
  userAgent.BROWSER_VERSIONS.firefox = null;
  userAgent.BROWSER_VERSIONS.firefoxESR = null;

  const server = await createTestServer({
    cors: true,
    routes: {
      '/chromium': {
        status: chromiumStatus,
        body: chromiumResponse
      },
      '/firefox': {
        status: firefoxStatus,
        body: firefoxResponse
      }
    }
  });

  userAgent.setUrls({
    chromiumVersionsUrl: `${server.url}/chromium`,
    firefoxVersionsUrl: `${server.url}/firefox`
  });

  return userAgent;
};

module.exports = {testUserAgent};
