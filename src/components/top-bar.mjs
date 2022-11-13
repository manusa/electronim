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
import {html, IconButton} from './index.mjs';

/**
 * A TopBar partially based on Bulma's Navbar component.
 */
export const TopBar = ({
  title,
  titleClass = 'navbar-item is-size-5 has-text-info has-text-weight-bold',
  containerClass = '',
  endComponents = '',
  endComponentsClass = '',
  fixed = false
}) => {
  if (fixed) {
    document.body.classList.add('has-navbar-fixed-top');
  }
  return html`
    <nav class=${`top-bar navbar ${fixed ? 'is-fixed-top' : ''}`}>
      <div class=${`not-navbar-brand is-flex is-flex-grow-1 is-align-content-center ${containerClass}`}>
        <div class=${`not-navbar-brand is-flex is-flex-grow-1 ${titleClass}`}>${title}</div>
        <div class=${endComponentsClass}>${endComponents}</div>
      </div>
    </nav>
  `;
};

/**
 * A top app bar based on Material design (3) guidelines.
 *
 * @param icon represented using a Material Icon codepoint.
 * @param iconClick callback function to be executed when the icon is clicked.
 * @param headline the headline of the app bar.
 * @see https://m3.material.io/components/top-app-bar
 */
export const TopAppBar = ({
  icon,
  iconClick = () => {},
  headline
}) => {
  document.body.classList.add('has-top-app-bar');
  return html`
    <div class='material3 top-app-bar small elevation-0 surface'>
      <${IconButton} className='leading-navigation-icon title-large' icon=${icon} onClick=${iconClick}/>
      <div class='top-app-bar__headline title-large'>${headline}</div>
      <div class='trailing-icon title-large'></div>
    </div>
  `;
};
