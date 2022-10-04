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
const {html} = window;

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
