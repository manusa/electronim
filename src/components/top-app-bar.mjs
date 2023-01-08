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
 * A top app bar based on Material design (3) guidelines.
 *
 * @param icon represented using a Material Icon codepoint.
 * @param iconClick callback function to be executed when the icon is clicked.
 * @param headline the headline of the app bar.
 * @param components or component containing an icon displayed at the end of the app bar.
 * @see https://m3.material.io/components/top-app-bar
 */
export const TopAppBar = ({
  icon,
  iconClick = () => {},
  iconDisabled = false,
  headline,
  trailingIcon
}) => {
  document.body.classList.add('has-top-app-bar');
  return html`
    <div class='material3 top-app-bar small elevation-0 surface'>
      <${IconButton}
          className='leading-navigation-icon title-large' icon=${icon} onClick=${iconClick} disabled=${iconDisabled}
      />
      <div class='top-app-bar__headline title-large'>${headline}</div>
      <div class='trailing-icon title-large'>${trailingIcon}</div>
    </div>
  `;
};
