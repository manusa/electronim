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
import {html, render, DropDown, Icon} from '../components/index.mjs';

const {aboutOpenDialog, close, helpOpenDialog, settingsOpenDialog} = window.electron;

const getAppMenu = () => document.querySelector('.app-menu');

const MenuItem = ({icon, label, onClick, testId}) => html`
  <${DropDown.Item} data-testid=${testId} onClick=${onClick}>
    <${Icon} icon=${icon}>${label}</${Icon}>
  </${DropDown.Item}>
`;

const AppMenu = () => {
  const noBubbling = func => e => {
    e.preventDefault();
    e.stopPropagation();
    func();
  };
  return (html`
    <div class='wrapper' onClick=${close}>
      <div class='scrim'>
        <${DropDown} active=${true}>
        <${DropDown.Menu}>
          <${MenuItem} icon='fas fa-question-circle' label='Help' testId='help-menu-entry'
            onClick=${noBubbling(helpOpenDialog)} />
          <${MenuItem} icon='fas fa-cog' label='Settings' testId='settings-menu-entry'
            onClick=${noBubbling(settingsOpenDialog)} />
          <${MenuItem} icon='fas fa-info-circle' label='About' testId='about-menu-entry'
            onClick=${noBubbling(aboutOpenDialog)} />
        </${DropDown.Menu}>
        </${DropDown}>
      </div>
    </div>
  `);
};

render(html`<${AppMenu} />`, getAppMenu());
