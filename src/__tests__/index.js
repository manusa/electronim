/*
   Copyright 2022 Marc Nuri San Felix

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
module.exports = {
  spawnElectron: require('./playwright.js').spawnElectron,
  testElectron: require('./electron.js').testElectron,
  testSettings: require('./settings.js').testSettings,
  testUpdate: require('./update.js').testUpdate,
  testUserAgent: require('./user-agent.js').testUserAgent,
  createTestServer: require('./http-server.js').createTestServer,
  // The e2e suites assert with Playwright's matchers, so they need Playwright's expect rather than
  // Jest's global. Exposed here so it comes from the same require they already use, and lazily so
  // that the unit suites, which also load this module, never pull @playwright/test in.
  get expect() {
    return require('@playwright/test').expect;
  }
};
