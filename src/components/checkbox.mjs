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
import {html, Icon} from './index.mjs';

/**
 * A Checkbox based on Material design (3) guidelines.
 *
 * @param checked whether the checkbox is checked or not.
 * @param onClick callback function to be executed when the checkbox is clicked.
 * @param label optional label to be displayed along with the checkbox.
 * @param value the checkbox value.
 * @param properties any other properties to be added to the checkbox.
 */
export const Checkbox = ({
  checked,
  onClick,
  label,
  value,
  ...properties
}) => {
  let checkboxClass = 'material3 checkbox';
  if (checked) {
    checkboxClass += ' checked';
  }
  const onCheck = e => {
    e.preventDefault();
    e.stopPropagation();
    onClick(e);
  };
  return html`
    <label class=${checkboxClass} onClick=${onCheck} ...${properties}>
      <div class='checkbox__box'>
        <${Icon} className='checkbox__icon'>${checked ? Icon.check : ''}</${Icon}>
      </div>
      ${label && html`<span class='checkbox__label'>${label}</span>`}
      <input type='checkbox' class='checkbox__input' value=${value} checked=${checked} />
    </label>
  `;
};
