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
import {html, useState} from './index.mjs';

export const DropDown = ({active = false, children}) => {
  const className = `dropdown ${active ? 'is-active' : ''}`;
  return (html`
    <div class=${className}>${children}</div>
  `);
};

DropDown.Menu = ({children}) => (html`
  <div class='dropdown-menu' role='menu'>
    <div class='dropdown-content'>${children}</div>
  </div>
`);

DropDown.Item = ({onClick, children, ...properties}) => {
  const [hover, setHover] = useState(false);
  const onMouseOver = () => setHover(true);
  const onMouseOut = () => setHover(false);
  const className = `dropdown-item ${hover ? 'is-active' : ''}`;
  return (html`
    <a 
      class=${className}
      onClick=${onClick}
      onMouseOver=${onMouseOver}
      onMouseOut=${onMouseOut}
      ...${properties}
    >
      ${children}
    </a>
  `);
};

DropDown.Divider = () => (html`
  <hr class='dropdown-divider'/>
`);

