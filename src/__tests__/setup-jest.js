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
afterEach(async () => {
  jest.useRealTimers();
  const fs = require('node:fs');

  // Clean up all tracked temporary directories
  if (global.__testTempDirectories__) {
    while (global.__testTempDirectories__.length > 0) {
      const dir = global.__testTempDirectories__.pop();
      try {
        await fs.promises.rm(dir, {recursive: true, force: true});
      } catch {
        // Ignore errors if directory was already cleaned up
      }
    }
  }

  // Close all tracked HTTP test servers
  if (global.__testHttpServers__) {
    while (global.__testHttpServers__.length > 0) {
      const server = global.__testHttpServers__.pop();
      try {
        await server.close();
      } catch {
        // Ignore errors if server was already closed
      }
    }
  }
});
