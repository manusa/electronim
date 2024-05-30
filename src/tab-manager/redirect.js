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
const {shell} = require('electron');

const matchUrls = regexList => (viewUrl, url) =>
  regexList.some(regex => viewUrl.href.match(regex) || url.href.match(regex));

const isOAuth = matchUrls([
  /^https:\/\/(.+\.)?github\.com\/login\/oauth.*/, // NOSONAR
  /^https:\/\/sso\.godaddy\.com\/.*/, // NOSONAR
  /^https:\/\/.+\.google\.com\/o\/oauth2\/.*/, // NOSONAR
  /^https:\/\/.+\.google\.com\/accounts\/signin.*/, // NOSONAR
  /^https:\/\/.+\.google\.com\/signin\/oauth.*/, // NOSONAR
  /^https:\/\/accounts\.google\.com\/.*/, // NOSONAR
  /^https:\/\/account\.live\.com\/.*/, // NOSONAR
  /^https:\/\/login\.live\.com\/.*/, // NOSONAR
  /^https:\/\/login\.microsoftonline\.com\/.*/, // NOSONAR
  /^https:\/\/auth\.openai\.com\/.*/, // NOSONAR
  /^https:\/\/auth0\.openai\.com\/.*/, // NOSONAR
  /^https:\/\/auth\.redhat\.com\/auth\/.*/, // NOSONAR
  /^https:\/\/sso\.secureserver\.net\/.*/, // NOSONAR
  /^https:\/\/.+\.skype\.com\/login\/.*/, // NOSONAR
  /^https:\/\/.+\.skype\.com\/Auth\/.*/, // NOSONAR
  /^https:\/\/.+\.twitter\.com\/login.*/, // NOSONAR
  /^https:\/\/.+\.twitter\.com\/logout.*/, // NOSONAR
  /^https:\/\/twitter\.com\/x.*/, // NOSONAR
  /^https:\/\/x\.com\/login.*/, // NOSONAR
  /^https:\/\/x\.com\/logout.*/, // NOSONAR
  /^https:\/\/idbroker\.webex\.com\/idb\/oauth2\/.*/, // NOSONAR
  /^https:\/\/accounts\.zoho\.(eu|com)\/signin.*/, // NOSONAR
  /^https:\/\/.+\.zoom\.us\/profile.*/, // NOSONAR
  /^https:\/\/.+\.zoom\.us\/signin.*/ // NOSONAR
]);

const isHandledInternally = (viewUrl, url) => [
  /^https:\/\/app\.slack\.com\/.*/, // NOSONAR
  /^https:\/\/files\.slack\.com\/.*/ // NOSONAR
].some(regex => url.href.match(regex));

const isSameOrigin = (viewUrl, url) => url.origin === viewUrl.origin;

const shouldOpenInExternalBrowser = (view, url) => {
  const viewUrl = new URL(view.webContents.getURL());
  let ret = true;
  [isSameOrigin, isOAuth, isHandledInternally].forEach(f => {
    if (ret && f(viewUrl, url)) {
      ret = false;
    }
  });
  return ret;
};

const openExternal = urlString => {
  if (!['http:', 'https:', 'ftp:', 'ftps:'].includes(new URL(urlString).protocol)) {
    return;
  }
  shell.openExternal(urlString).then(() => {});
};

const handleRedirect = view => (e, urlString) => {
  const url = new URL(urlString);
  if (shouldOpenInExternalBrowser(view, url)) {
    e.preventDefault();
    openExternal(urlString);
  }
};

const windowOpenHandler = view => ({url}) => {
  if (!shouldOpenInExternalBrowser(view, new URL(url))) {
    return {action: 'allow'};
  }
  openExternal(url);
  return {action: 'deny'};
};

module.exports = {
  handleRedirect, shouldOpenInExternalBrowser, windowOpenHandler
};
