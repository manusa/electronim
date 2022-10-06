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
import {html, sizes} from '../index.mjs';

export const Select = ({
  value, onChange, size = sizes.normal, children
}) => (html`
  <div class='control'>
    <div class=${`select ${size}`}>
      <select value=${value} onChange=${onChange}>
        ${children}
      </select>
    </div>
  </div>
`);

Select.Option = ({value, children}) => {
  const props = {};
  if (value) {
    props.value = value;
  }
  return html`
    <option ...${props}>${children}</option>
  `;
};
