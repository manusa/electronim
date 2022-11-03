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

export const Icon = ({icon, children}) => {
  const theIcon = html`<span class='icon'><i class=${icon}></i></span>`;
  if (!children) {
    return theIcon;
  }
  return (html`
    <span class='icon-text'>
      ${theIcon}
      <span>${children}</span>
    </span>
  `);
};