const path = require('path');

const createLink = href => {
  const link = document.createElement('link');
  link.type = 'text/css';
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

const addStylesheet = href => {
  if (document.head) {
    createLink(href);
  } else {
    document.addEventListener('DOMContentLoaded', () => createLink(href));
  }
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
