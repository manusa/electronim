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
import {html, useState, Icon} from './index.mjs';

/**
 *  A select field based on Material design (3) guidelines.
 *
 * @param type the select type (one of outlined or filled).
 * @param label the select label.
 * @param value the select value.
 * @param onChange the function to be called when the select value changes.
 * @param children the collection of Select.Option components to be rendered.
 * @param properties any other properties to be added to the select container.
 */
export const Select = ({
  type = Select.types.outlined,
  label,
  value,
  onChange,
  children,
  ...properties
}) => {
  const [focused, setFocused] = useState(false);
  const onFocus = () => setFocused(true);
  const onBlur = () => setFocused(false);
  let selectClass = `material3 select ${type}`;
  if (focused) {
    selectClass += ' focused';
  }
  if (label) {
    selectClass += ' has-label';
  }
  return html`
  <div class=${selectClass} ...${properties}>
    ${label && html`<span class='select__label'>${label}</span>`}
    <${Icon} className='select__arrow'>${Icon.arrowDropDown}</${Icon}>
    <select class='select__select' value=${value} onChange=${onChange} onFocus=${onFocus} onBlur=${onBlur}>
      ${children}
    </select>
  </div>
  `;
};

Select.Option = ({value, children}) => html`
  <option value=${value}>${children}</option>
`;

Select.types = {
  filled: 'filled', // Not implemented yet
  outlined: 'outlined'
};
