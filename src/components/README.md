# Components

This module contains the library of shared components to be used accross the application.

## Structure

Since ElectronIM is based on Preact in combination with Electron, to be able to use the component within a browser, you need to pass the `html` bound `h` function from `preact` to the component.

Every component definition will start with a function that accepts the `html` parameter that returns an arrow function with the component.

```javascript
module.exports.Component = html => ({property1}) => html`
  <div>Your Component Definition</div>
`;
```

## Using Components

Components need to be imported in a `preload.js` script in order to be used ina `browser-xxx.js` file.

```javascript
window.preact = require('preact');
window.html = require('htm').bind(window.preact.h);
window.Component = require('../components').component(window.html);
```

Then you can use the component in the `browser-xxx.js` file.

```javascript
const {html, Component, preact: {render}} = window;
const App = () => html`<${Component} property1='value1' />`;
render(html`<${App} />`, document.querySelector('.root'));
```
