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
const {ipcMain: eventBus} = require('electron');
const {ELECTRONIM_VERSION, APP_EVENTS} = require('../constants');
const {httpClient} = require('../http-client');
const GITHUB_RELEASES = 'https://github.com/manusa/electronim/releases';

// URL can be overridden for testing purposes
let githubReleasesLatest = `${GITHUB_RELEASES}/latest`;

const TAG_MATCHER = new RegExp(`${GITHUB_RELEASES}/tag/(.+)`);

// Store the latest version
let latestVersion = null;

// For testing purposes only
const setUrl = ({githubReleasesLatestUrl}) => {
  if (githubReleasesLatestUrl) {
    githubReleasesLatest = githubReleasesLatestUrl;
  }
};

/**
 * Checks for updates and emits event to IPC main if a new version is available.
 */
const checkForUpdates = async () => {
  try {
    // Use HTTP endpoint instead of API to avoid rate limits
    const response = await httpClient.get(githubReleasesLatest, {
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
    latestVersion = version;
    if (ELECTRONIM_VERSION !== latestVersion) {
      eventBus.emit(APP_EVENTS.electronimNewVersionAvailable, true);
    }
  } catch (error) {
    console.debug('Error checking for updates', error);
  }
};

/**
 * Starts polling for updates. Checks immediately and then every 30 minutes.
 */
const checkForUpdatesInit = async () => {
  await checkForUpdates();
  setInterval(checkForUpdates, 1000 * 60 * 30).unref();
};

module.exports = {
  get latestVersion() {
    return latestVersion;
  },
  setUrl,
  checkForUpdatesInit
};
