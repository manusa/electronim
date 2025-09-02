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
  const os = require('node:os');
  const fs = require('node:fs');
  const settings = require('../settings');
  if (os.tmpdir && settings.appDir && settings.appDir.startsWith(os.tmpdir())) {
    await fs.promises.rm(settings.appDir, {recursive: true, force: true});
  }
});
