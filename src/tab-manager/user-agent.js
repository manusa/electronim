/*
   Copyright 2019 Marc Nuri San Felix

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
const axios = require('axios');
const CHROMIUM_VERSIONS = 'https://omahaproxy.appspot.com/all.json';

const latestChromium = async () => {
  const {data: tags} = await axios.get(CHROMIUM_VERSIONS);
  const stableVersion = tags
    .filter(version => version.os === 'linux')
    .flatMap(version => version.versions)
    .filter(version => version.channel === 'stable');
  return stableVersion && stableVersion.length > 0 ? stableVersion[0].version : null;
};

const replaceChromeVersion = version => userAgent => userAgent
  .replace(/Chrome\/.*? /g, `Chrome/${version} `);

const sanitizeUserAgent = userAgent => userAgent
  .replace(/ElectronIM\/.*? /g, '')
  .replace(/Electron\/.*? /g, '');

module.exports = {
  latestChromium,
  replaceChromeVersion,
  sanitizeUserAgent
};
