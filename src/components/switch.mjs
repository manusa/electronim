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
import {html} from './index.mjs';

/**
 * A Switch based on Material design (3) guidelines.
 *
 * @param checked whether the switch is checked or not.
 * @param onClick callback function to be executed when the switch is clicked.
 * @param properties any other properties to be added to the switch.
 */
export const Switch = ({
  checked = false,
  onClick,
  ...properties
}) => {
  let switchClass = 'material3 switch';
  if (checked) {
    switchClass += ' switch--checked';
  }
  const onSwitch = e => {
    e.preventDefault();
    e.stopPropagation();
    onClick(e);
  };
  return html`
    <div class=${switchClass} onClick=${onSwitch} ...${properties}>
      <span class='switch__track' />
      <span class='switch__thumb' />
      <input type='checkbox' class='switch__input' checked=${checked} />
    </div>
  `;
};
