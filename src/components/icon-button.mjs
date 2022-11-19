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
 * An Icon Button based on Material design (3) guidelines.
 *
 * @param icon represented using a Material Icon codepoint.
 * @param iconClick callback function to be executed when the icon is clicked.
 * @param disabled whether the button is disabled or not.
 * @param className additional classes to be added to the button.
 */
export const IconButton = ({
  icon,
  onClick = () => {},
  disabled = false,
  className = '',
  ...properties
}) => html`
  <a
    class=${`material3 icon-button ${disabled ? 'disabled ' : ''}${className}`}
    disabled=${disabled} onClick=${disabled ? null : onClick}
    ...${properties}
  >${icon}</a>
`;
