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
import {html, useState, IconButton} from './index.mjs';

/**
 * A Navigation Rail based on Material design (3) guidelines.
 *
 * @param children the collection of NavigationRail.Button components to be rendered.
 */
export const NavigationRail = ({
  children
}) => {
  document.body.classList.add('has-navigation-rail');
  return html`
    <div class='material3 navigation-rail'>
      ${children}
    </div>
  `;
};

NavigationRail.Button = ({
  active = false,
  icon,
  onClick,
  label
}) => {
  const [hover, setHover] = useState(false);
  const onMouseOver = () => setHover(true);
  const onMouseOut = () => setHover(false);
  let className = 'navigation-rail-button';
  if (active) {
    className += ' active';
  }
  if (hover) {
    className += ' hover';
  }
  return html`
    <a href='#' class=${className}
       onMouseOver=${onMouseOver} onMouseOut=${onMouseOut} onClick=${onClick}
    >
      <${IconButton} className='navigation-rail-button__icon' icon=${icon} />
      ${label && html`<div class='navigation-rail-button__label'>${label}</div>`}
    </a>
  `;
};
