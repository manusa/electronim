/*
   Copyright 2023 Marc Nuri San Felix

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
const {session} = require('electron');
const {loadSettings} = require('../settings');

const clearCache = s => Promise.all([
  s.clearCache(),
  s.clearCodeCaches({}),
  s.clearHostResolverCache(),
  s.clearStorageData({storages: ['serviceworkers', 'cachestorage']})
]);

const quit = () => {
  const persistentSessions = loadSettings().tabs
    .filter(({sandboxed = false}) => sandboxed)
    .map(({id}) => session.fromPartition(`persist:${id}`));
  // eslint-disable-next-line no-console
  [...persistentSessions, session.defaultSession].forEach(s => clearCache(s).catch(console.error));
};

module.exports = {quit};
