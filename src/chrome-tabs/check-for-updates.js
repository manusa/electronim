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
const axios = require('axios');
const {ELECTRONIM_VERSION} = require('../constants');
const GITHUB_RELEASES = 'https://github.com/manusa/electronim/releases';
const GITHUB_RELEASES_LATEST = `${GITHUB_RELEASES}/latest`;
const TAG_MATCHER = new RegExp(`${GITHUB_RELEASES}/tag/(.+)`);

/**
 * Checks if there is a new version of Electronim available and compares it with the current version.
 *
 * @returns {Promise<{matchesCurrent: boolean, version: string}>}
 */
const getLatestRelease = async () => {
  // Use HTTP endpoint instead of API to avoid rate limits
  const response = await axios.get(GITHUB_RELEASES_LATEST, {
    headers: {Accept: '*/*'},
    maxRedirects: 0,
    validateStatus: null
  });
  if (response.status !== 302) {
    throw new Error('Unexpected response from GitHub');
  }
  let version = TAG_MATCHER.exec(response.headers.location)[1];
  if (version.startsWith('v')) {
    version = version.substring(1);
  }
  return ({
    version,
    matchesCurrent: ELECTRONIM_VERSION === version
  });
};

module.exports = {getLatestRelease};
