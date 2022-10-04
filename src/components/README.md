# Components

This ES module contains the library of shared components to be used across the application.

## Structure

To be able to use the component within a browser, there needs to be an  `html` bound `h` function from `preact` globally available.

```javascript
export const Component = ({property1}) => html`
  <div>Your Component Definition</div>
`;
```

To expose the component in the public API, it needs to be referenced from the `index.mjs` file.

```javascript
export {Component} from './component.mjs';
```

## Using Components

Components are ES modules that can be imported from the browser js (`xxx.browser.mjs` files).

```javascript
const {html} = window;
import {Component} from '../components/index.mjs';

const App = () => html`<${Component} property1='value1' />`;
render(html`<${App} />`, document.querySelector('.root'));
```

Note that the `xxx.browser.mjs` files need to be loaded as JavaScript ES modules in the `index.html` file.

```html
<script src="./xxx.browser.mjs" type="module"></script>
```
