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
import {ELECTRONIM_VERSION, html, render, Card, Icon, Logo, TopAppBar} from '../components/index.mjs';

const {close, versions} = window.electron;

const TWITTER_LINK = 'https://twitter.com/share?url=https://github.com/manusa/electronim&text=I%27m%20using%20ElectronIM%20as%20my%20communications%20center%20and%20I%20love%20it%2C%20you%20should%20try%20it%20out%20too%21';

const getAppMenu = () => document.querySelector('.about-root');

const Version = ({component, value}) => html`
  <div class='about-content__version'>
    <span class='version__component'>${component}</span>
    <span class='version__value'>${value}</span>
  </div>
`;

const About = () => html`
  <${TopAppBar} icon=${Icon.arrowBack} iconClick=${close} headline='About ElectronIM'/>
  <div class='about-content'>
    <${Card}
        interactive=${true /* Enable state layer just for fun */}
        image=${html`<${Logo} />`}
        headline=${`ElectronIM ${ELECTRONIM_VERSION}`}
    >
      <div class='about-content__release'>
        <a href=${`https://github.com/manusa/electronim/releases/tag/v${ELECTRONIM_VERSION}`}>
          Release Notes
        </a> - <a href='https://github.com/manusa/electronim/blob/main/LICENSE'>
          Apache License, Version 2.0
        </a>
      </div>
      <div class='about-content__versions'>
        <${Version} component='Electron' value=${versions.electron} />
        <${Version} component='Chromium' value=${versions.chrome} />
        <${Version} component='Node' value=${versions.node} />
        <${Version} component='V8' value=${versions.v8} />
      </div>
      <${Card.Divider}/>
      <div class='about_content__promotion'>
        <p>
          Do you enjoy using ElectronIM? Help us spread the word by <a href=${TWITTER_LINK}>
          sharing</a> it with your friends!
        </p>
        <p>
          A <a href='https://github.com/manusa/electronim'>GitHub star</a> also goes a long way to help us grow the
          project!
        </p>
      </div>
    </${Card}>
  </div>
`;

render(html`<${About} />`, getAppMenu());
