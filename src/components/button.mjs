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
 * A Button based on Material design (3) guidelines.
 *
 * @param type the type of button to be rendered. Possible values are outlined and filled.
 * @param onClick callback function to be executed when the button is clicked.
 * @param disabled whether the button is disabled or not.
 * @param className additional classes to be added to the button.
 * @param children the content to be rendered inside the button.
 */
export const Button = ({
  type = Button.types.outlined,
  onClick = () => {},
  disabled = false,
  className = '',
  icon,
  children,
  ...properties
}) => html`
  <button
    class=${`material3 button ${type} ${disabled ? 'disabled ' : ''}${className}`}
    disabled=${disabled}
    onClick=${disabled ? null : onClick}
    ...${properties}
  >
    ${icon && html`<span class="icon">${icon}</span>`}
    <span class="label">${children}</span>
  </button>
`;

Button.types = {
  filled: 'filled', // Not implemented yet
  outlined: 'outlined'
};
