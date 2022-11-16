/*
   Copyright 2019 Marc Nuri San Felix

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

export const Logo = ({
  electronColor = '#87c7d8',
  nucleusColor = '#42598c',
  orbitColor = '#d89f87',
  ...props
}) => html`
  <svg class='electronim-logo' viewBox='0 0 390 390' xmlSpace='preserve' ...${props} >
    <style>
      .electron{
        fill: ${electronColor}
      }
      .nucleus {
        fill: url(#nucleusGradient);
      }
      .orbit {
        fill: none;
        stroke: ${orbitColor};
        stroke-width: 2.7469;
        stroke-miterlimit: 10;
      }
    </style>
    <path
      id='orbit'
      d='M160.3 340.5c-6.4-3.3-11.9-8.1-16.8-13.7-14-16-23.4-39-33.6-53.1-10.3-14.1-22.9-43.8-34.3-78.1-8.4-25.1-10.3-75.9-8.2-85.3 1.9-8.5 9-22 20.1-33.1 15.8-15.8 38.7-14.6 63.1-12.4C203.1 69.5 263.3 98 278.8 107c39.1 22.7 76 44.2 77.8 77.8 1.9 34.9-32.3 66.5-69.1 89.8-15.9 10.1-75.3 47.9-153 45.7-22.1-.6-38.8-2.2-52.3-16.9C66.4 286 65.6 253 70 218.3c7.3-57.3 33.2-98 42.6-113.1 25.6-41.1 51.6-68.8 82.4-71.4 43.2-3.6 66.7 48 90.6 87 11.3 18.5 43 74.6 37.1 142.8-2.3 26.4-8.6 36.4-13.7 42.1-22 24.6-64 18.5-97.1 13.7 0 0-99.9-14.5-165.7-92-6.7-7.9-13.9-18.1-14.6-31.6-.9-17.1 9.2-30.4 19.7-43.9 15.1-19.4 31.5-32 43.9-40.3 33.9-22.6 64.7-31 92.9-38.5 2.5-.7 40.3-10.4 78.3-8.2 7.5.4 18.6 1.5 30.2 8.2 3.8 2.2 14.3 8.5 20.6 20.6 6.5 12.5 8.6 28.6 8.7 36.6.7 41.9-10.4 79.7-31 122.7-10.9 22.7-23.5 35.6-37.7 54.9-10.5 14.4-17.8 22.5-28.8 29.3-11.9 7.3-26.5 10.4-34.3 11.6 0 .1-14.1 1.8-33.8-8.3z'
      class='orbit'
    />
    <g id='electrons'>
      <circle id='b' class='electron' cx=${195} cy=${351.6} r=${25.2}/>
      <circle id='b-r' class='electron' cx=${282.9} cy=${282.9} r=${25.2}/>
      <circle id='b-l' class='electron' cx=${112.6} cy=${282.9} r=${25.2}/>
      <circle id='m-r' class='electron' cx=${354.3} cy=${197.7} r=${25.2}/>
      <radialGradient id='nucleusGradient'>
        <stop offset=${0} style=${{stopColor: nucleusColor}} />
        <stop offset='75%' style=${{stopColor: nucleusColor, stopOpacity: 0.92}} />
        <stop offset='100%'
          style=${{stopColor: nucleusColor, stopOpacity: 0.8}} />
      </radialGradient>
      <path
        id='nucleus'
        d='M195 122.2c-41.7 0-75.6 33.9-75.6 75.6 0 41.7 33.9 75.6 75.6 75.6 41.7 0 75.6-33.9 75.6-75.6 0-41.7-33.9-75.6-75.6-75.6zm33.9 106.5h-66v-12h66zm-18-24h-48v-12h48zm18-24h-66v-12h66z'
        class='nucleus'
      />
      <circle id='m-l' class='electron' cx=${35.7} cy=${197.7} r=${25.2}/>
      <circle id='t-r' class='electron' cx=${282.9} cy=${109.8} r=${25.2}/>
      <circle id='t-l' class='electron' cx=${112.6} cy=${109.8} r=${25.2}/>
      <circle id='t' class='electron' cx=${195} cy=${38.4} r=${25.2}/>
    </g>
  </svg>
`;
