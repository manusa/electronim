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
const {html} = window;

import {sizes} from './index.mjs';

const FieldContainer = ({className = '', children, ...properties}) => (html`
  <div class=${`field ${className}`} ...${properties}>
    ${children}
  </div>
`);

export const Field = ({label, children, ...properties}) => (html`
  <${FieldContainer} ...${properties}>
    ${label && html`<label class='label'>${label}</label>`}
    <div class='control'>${children}</div>
  </${FieldContainer}>
`);

export const HorizontalField = ({label, labelSize = sizes.normal, children, ...properties}) => {
  const labelClassName = `field-label ${labelSize}`;
  return html`
    <${FieldContainer} className='is-horizontal' ...${properties}>
      ${label && html`<div class=${labelClassName}><label class='label'>${label}</label></div>`}
      <div class='field-body'>
        <div class='control'>${children}</div>
      </div>
    </${FieldContainer}>
  `;
};
