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
 * A menu based on Material design (3) guidelines.
 *
 * @param children the collection of Menu.Item components to be rendered.
 */
export const Menu = ({children}) => html`
  <div class='material3 menu elevation-2 surface body-large'>
    ${children}
  </div>
`;

Menu.Item = ({
  icon,
  label,
  trailingIcon,
  ...properties
}) => html`
  <a class='menu-item' ...${properties}>
    <${Icon} className='menu-item__leading-icon'>${icon}</${Icon}>
    <div class='menu-item__text'>${label}</div>
    <${Icon} className='menu-item__trailing-icon'>${trailingIcon}</${Icon}>
  </a>
`;
