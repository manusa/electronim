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
import {html, render, Icon, Menu} from '../components/index.mjs';

const {aboutOpenDialog, close, helpOpenDialog, quit, settingsOpenDialog} = window.electron;

const getAppMenu = () => document.querySelector('.app-menu');

const AppMenu = () => {
  const noBubbling = func => e => {
    e.preventDefault();
    e.stopPropagation();
    func();
  };
  return (html`
    <div class='wrapper' onClick=${close}>
      <div class='scrim'>
        <${Menu}>
          <${Menu.Item} icon=${Icon.help} label='Help' data-testid='help-menu-entry'
            onClick=${noBubbling(helpOpenDialog)} />
          <${Menu.Item} icon=${Icon.settings} label='Settings' data-testid='settings-menu-entry'
            onClick=${noBubbling(settingsOpenDialog)} />
          <${Menu.Item} icon=${Icon.info} label='About' data-testid='about-menu-entry'
            onClick=${noBubbling(aboutOpenDialog)} />
          <${Menu.Item} icon=${Icon.close} label='Quit' data-testid='quit-menu-entry'
            onClick=${noBubbling(quit)} />
        </${Menu}>
      </div>
    </div>
  `);
};

render(html`<${AppMenu} />`, getAppMenu());
