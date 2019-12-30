const {shell} = require('electron');

const matchUrls = regexList => (browserViewUrl, url) =>
  regexList.some(regex => browserViewUrl.href.match(regex) || url.href.match(regex));

const isOAuth = matchUrls([
  /^https:\/\/.+\.google\.com\/o\/oauth2\/.*/,
  /^https:\/\/.+\.google\.com\/accounts\/signin.*/,
  /^https:\/\/.+\.google\.com\/signin\/oauth.*/,
  /^https:\/\/(.+\.)?github\.com\/login\/oauth.*/
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
