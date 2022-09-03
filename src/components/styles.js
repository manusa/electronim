const path = require('path');

const createLink = href => {
  const link = document.createElement('link');
  link.type = 'text/css';
  link.rel = 'stylesheet';
  link.href = href;
  return link;
};

const addStylesheet = href => {
  // eslint-disable-next-line prefer-const
  let observer;
  const callback = () => {
    if (document.head) {
      document.head.append(createLink(href));
      observer.disconnect();
    }
  };
  observer = new MutationObserver(callback);
  observer.observe(document, {childList: true, subtree: true});
};

const bulma = () => addStylesheet(path.resolve(path.dirname(require.resolve('bulma')), 'css', 'bulma.min.css'));

const chromeTabs = () => {
  addStylesheet(path.resolve(path.dirname(require.resolve('chrome-tabs')), '..', 'css', 'chrome-tabs.css'));
  addStylesheet(
    path.resolve(path.dirname(require.resolve('chrome-tabs')), '..', 'css', 'chrome-tabs-dark-theme.css'));
};

const fontAwesome = () => addStylesheet(
  path.resolve(path.dirname(require.resolve('@fortawesome/fontawesome-free')), '..', 'css', 'all.min.css'));

module.exports = {addStylesheet, bulma, chromeTabs, fontAwesome};
