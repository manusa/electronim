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
const {docs, close} = window.electron;

import {ELECTRONIM_VERSION, html, render, Icon, TopAppBar} from '../components/index.mjs';

const helpRoot = () => document.querySelector('.help-root');

const Document = ({id}) => html`
  <a id=${id} />
  <div dangerouslySetInnerHTML=${{
    __html: docs[id]
  }}></div>
`;

const Toc = () => html`
  <div class="toc-container">
    <h1>Table of Contents</h1>
    <ol>
      <li><a href="#Setup.md">Setup</a></li>
      <li><a href="#Keyboard-shortcuts.md">Keyboard Shortcuts</a></li>
      <li><a href="#Troubleshooting.md">Troubleshooting</a></li>
    </ol>
  </div>
`;

const Footer = () => html`
  <div class="documents-footer">
      ElectronIM version ${ELECTRONIM_VERSION}
  </div>
`;

const Content = () => html`
  <div class="documents-container">
    <${Document} id="Setup.md"/>
    <${Document} id="Keyboard-shortcuts.md"/>
    <${Document} id="Troubleshooting.md"/>
    <${Footer}/>
  </div>
`;

const Help = () => html`
    <${TopAppBar} headline='Help' icon=${Icon.arrowBack} iconClick=${close} />
    <div class="help-content body-large">
      <${Toc} />
      <${Content} />
    </div>
  `;

render(html`<${Help} />`, helpRoot());
