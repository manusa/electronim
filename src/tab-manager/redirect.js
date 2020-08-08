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

const matchUrls = regexList => (browserViewUrl, url) =>
  regexList.some(regex => browserViewUrl.href.match(regex) || url.href.match(regex));

const isOAuth = matchUrls([
  /^https:\/\/.+\.google\.com\/o\/oauth2\/.*/, // NOSONAR
  /^https:\/\/.+\.google\.com\/accounts\/signin.*/, // NOSONAR
  /^https:\/\/.+\.google\.com\/signin\/oauth.*/, // NOSONAR
  /^https:\/\/accounts\.google\.com\/.*/, // NOSONAR
  /^https:\/\/(.+\.)?github\.com\/login\/oauth.*/, // NOSONAR
  /^https:\/\/auth\.redhat\.com\/auth\/.*/ // NOSONAR
]);

const isSameOrigin = (browserViewUrl, url) => url.origin === browserViewUrl.origin;

const shouldOpenInExternalBrowser = (browserView, url) => {
  let ret = true;
  [isSameOrigin, isOAuth].forEach(f => {
    if (ret && f(new URL(browserView.webContents.getURL()), url)) {
      ret = false;
    }
  });
  return ret;
};

const handleRedirect = browserView => (e, urlString) => {
  const url = new URL(urlString);
  if (shouldOpenInExternalBrowser(browserView, url)) {
    e.preventDefault();
    shell.openExternal(urlString);
  }
};

module.exports = {
  handleRedirect, shouldOpenInExternalBrowser
};
