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
const {contextBridge, webFrame} = require('electron');

contextBridge.exposeInMainWorld('testing', {test: true});
// https://chromium.googlesource.com/chromium/chromium/+/ab158533ac3700b22b94a0679026d989d46109bf/chrome/common/extensions/api/webstorePrivate.json
// https://github.com/chromium/chromium/blob/main/chrome/common/extensions/api/webstore_private.json

const webstorePrivate = {
  // Installs extension by ID
  install: (expectedId, callback) => {
    console.log('[webstorePrivate] install called:', expectedId);
    if (callback) {
      callback();
    }
  },

  // Begins installation with manifest verification (manifest v3)
  // Returns Result enum: '', 'success', 'user_cancelled', 'unknown_error', etc.
  beginInstallWithManifest3: (details, callback) => {
    console.log('[webstorePrivate] beginInstallWithManifest3 called:', details);
    if (callback) {
      // Return empty string to indicate success
      callback('');
    }
  },

  // Completes installation started by beginInstallWithManifest3
  completeInstall: (expectedId, callback) => {
    console.log('[webstorePrivate] completeInstall called:', expectedId);
    if (callback) {
      callback();
    }
  },

  // Enables the app launcher
  enableAppLauncher: callback => {
    console.log('[webstorePrivate] enableAppLauncher called');
    if (callback) {
      callback();
    }
  },

  // Returns the sync user login
  getBrowserLogin: callback => {
    console.log('[webstorePrivate] getBrowserLogin called');
    if (callback) {
      callback({login: ''});
    }
  },

  // Returns the store login preference
  getStoreLogin: callback => {
    console.log('[webstorePrivate] getStoreLogin called');
    if (callback) {
      callback('');
    }
  },

  // Sets the store login preference
  setStoreLogin: (login, callback) => {
    console.log('[webstorePrivate] setStoreLogin called:', login);
    if (callback) {
      callback();
    }
  },

  // Returns WebGL status: 'webgl_allowed' or 'webgl_blocked'
  getWebGLStatus: callback => {
    console.log('[webstorePrivate] getWebGLStatus called');
    if (callback) {
      callback('webgl_allowed');
    }
  },

  // Returns whether the app launcher is enabled
  getIsLauncherEnabled: callback => {
    console.log('[webstorePrivate] getIsLauncherEnabled called');
    if (callback) {
      callback(false);
    }
  },

  // Returns whether the browser is in incognito mode
  isInIncognitoMode: callback => {
    console.log('[webstorePrivate] isInIncognitoMode called');
    if (callback) {
      callback(false);
    }
  },

  // Checks if extension is pending custodian approval
  isPendingCustodianApproval: (id, callback) => {
    console.log('[webstorePrivate] isPendingCustodianApproval called:', id);
    if (callback) {
      callback(false);
    }
  },

  // Returns the base-64 encoded referrer chain
  getReferrerChain: callback => {
    console.log('[webstorePrivate] getReferrerChain called');
    if (callback) {
      callback('');
    }
  },

  // Gets the extension installation status
  // Returns ExtensionInstallStatus: 'can_request', 'installable', 'enabled', etc.
  getExtensionStatus: (id, manifest, callback) => {
    console.log('[webstorePrivate] getExtensionStatus called:', id, manifest);
    if (callback) {
      callback('installable');
    }
  },

  // Returns the full Chrome version number
  getFullChromeVersion: callback => {
    console.log('[webstorePrivate] getFullChromeVersion called');
    if (callback) {
      // Return a realistic Chrome version
      callback({version_number: '131.0.6778.140'});
    }
  },

  // Returns the Manifest V2 deprecation status
  // Returns MV2DeprecationStatus: 'inactive', 'warning', 'soft_disable', 'hard_disable'
  getMV2DeprecationStatus: callback => {
    console.log('[webstorePrivate] getMV2DeprecationStatus called');
    if (callback) {
      callback('inactive');
    }
  }
};

contextBridge.exposeInMainWorld('webstorePrivate', webstorePrivate);

// window.chrome already exists in the Chromium window, we can't overwrite it
webFrame.executeJavaScript(`
  window.chrome = window.chrome || {};
  window.chrome.webstorePrivate = window.webstorePrivate;
`);
