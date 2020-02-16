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
const FIREFOX_VERSIONS = 'https://product-details.mozilla.org/1.0/firefox_versions.json';

const BROWSER_VERSIONS = {
  chromium: null,
  firefox: null
};

const latestChromium = async () => {
  const {data: tags} = await axios.get(CHROMIUM_VERSIONS);
  const stableVersion = tags
    .filter(version => version.os === 'linux')
    .flatMap(version => version.versions)
    .filter(version => version.channel === 'stable');
  return stableVersion && stableVersion.length > 0 ? stableVersion[0].version : null;
};

const latestFirefox = async () => {
  const {data: versions} = await axios.get(FIREFOX_VERSIONS);
  return versions && versions.LATEST_FIREFOX_VERSION ? versions.LATEST_FIREFOX_VERSION : null;
};

const initBrowserVersions = async () => {
  const setVersion = browser => version => {
    if (version) {
      BROWSER_VERSIONS[browser] = version;
    }
  };
  await Promise.all([
    latestChromium().then(setVersion('chromium')),
    latestFirefox().then(setVersion('firefox'))
  ]);
};

const replaceChromeVersion = userAgent =>
  userAgent.replace(/Chrome\/.*? /g, `Chrome/${BROWSER_VERSIONS.chromium} `);

const sanitizeUserAgent = userAgent => userAgent
  .replace(/ElectronIM\/.*? /g, '')
  .replace(/Electron\/.*? /g, '');

// eslint-disable-next-line no-unused-vars
const firefoxUserAgent = browserView => {
  let userAgent = browserView.webContents.userAgent;
  if (BROWSER_VERSIONS.firefox) {
    userAgent = userAgent.replace(/AppleWebKit.*/, `Gecko/20100101 Firefox/${BROWSER_VERSIONS.firefox}`);
  }
  return userAgent;
};

const userAgentForView = browserView => {
  let validUserAgent = sanitizeUserAgent(browserView.webContents.userAgent);
  if (BROWSER_VERSIONS.chromium) {
    validUserAgent = replaceChromeVersion(validUserAgent);
  }
  return validUserAgent;
};

module.exports = {
  BROWSER_VERSIONS,
  initBrowserVersions,
  userAgentForView
};
