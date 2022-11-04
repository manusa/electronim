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
const {ipcRenderer} = require('electron');
const {h, render} = require('preact');
const {useEffect, useState} = require('preact/hooks');
const htm = require('htm');
const html = htm.bind(h);

const ROOT_CLASS = 'electron-desktop-capturer-root';
const DEFAULT_SOURCES_OPTIONS = {
  types: ['screen', 'window']
};

const desktopCapturer = {
  // eslint-disable-next-line no-undef
  getSources: opts => ipcRenderer.invoke(APP_EVENTS.desktopCapturerGetSources, opts)
};

let currentRoot = null;

const removeRoot = () => {
  const $root = document.querySelector(`.${ROOT_CLASS}`);
  if ($root) {
    render(null, $root, currentRoot);
    $root.remove();
  }
};

const getOrCreateRoot = () => {
  removeRoot();
  const $root = document.createElement('div');
  $root.classList.add(ROOT_CLASS);
  document.body.append($root);
  return $root;
};

const stream = async id => window.navigator.mediaDevices.getUserMedia({
  audio: false,
  video: {
    mandatory: {
      chromeMediaSource: 'desktop',
      chromeMediaSourceId: id
    }
  }
});

const Style = () => html`
  <style>
    .${ROOT_CLASS} {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      background: rgba(30,30,30,.75);
      color: #fff;
      z-index: 999999;
    }
    .${ROOT_CLASS} .${ROOT_CLASS}__overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .${ROOT_CLASS} .${ROOT_CLASS}__sources {
      overflow: auto;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      max-height: 100vh;
      padding: 6px;
    }
    .${ROOT_CLASS} .${ROOT_CLASS}__source {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      width: 145px;
      margin: 6px;
      pointer-events: bounding-box;
      cursor: pointer;
      background: rgba(30,30,30,.5);
      padding: 6px;
      border-radius: 3px;
    }
    .${ROOT_CLASS} .${ROOT_CLASS}__source:hover,
    .${ROOT_CLASS} .${ROOT_CLASS}__source:focus {
      background: rgba(255,255,255,.1);
    }
    .${ROOT_CLASS} .${ROOT_CLASS}__thumbnail {
      margin: 0 auto;
      width: 100%;
      height: 81px;
      object-fit: cover;
    }
    .${ROOT_CLASS} .${ROOT_CLASS}__name {
      margin-top: 3px;
      text-align: center;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      user-select: none;
    }
  </style>
`;

// eslint-disable-next-line no-unused-vars
const Source = ({id, name, thumbnail, _display_id, _appIcon, resolve}) => {
  const selectStream = async event => {
    event.preventDefault();
    event.stopPropagation();
    resolve(await stream(id));
    removeRoot();
  };
  return html`
    <div class="${ROOT_CLASS}__source" onclick=${selectStream}>
      <img class="${ROOT_CLASS}__thumbnail" alt=${id} src=${thumbnail.toDataURL()} />
      <span class="${ROOT_CLASS}__name">${name}</span>
    </div>
  `;
};

const LoadingSources = ({sources}) => sources === null && html`
  <div>Loading sources...</div>
`;

const NoSourcesFound = ({sources}) => sources !== null && sources.length === 0 &&
  html`<div>No sources found</div>`;

const Container = ({resolve, reject}) => {
  const [sources, setSources] = useState(null);
  const updateSourcesFunction = async () => setSources(await desktopCapturer.getSources(DEFAULT_SOURCES_OPTIONS));
  useEffect(() => {
    setTimeout(updateSourcesFunction, sources ? 300 : 0);
  }, [sources]);
  const cancel = () => {
    reject(new Error('Screen share aborted by user'));
    removeRoot();
  };
  return html`
    <${Style}/>
    <div class="${ROOT_CLASS}__overlay" onclick=${cancel}>
      <div class="${ROOT_CLASS}__sources" >
        <${NoSourcesFound} sources=${sources}/>
        <${LoadingSources} sources=${sources}/>
        ${sources !== null && sources.map(source => (html`
          <${Source} resolve=${resolve} ...${source} />
        `))}
      </div>
    </div>
  `;
};

const getDisplayMedia = async (resolve, reject) => {
  currentRoot = render(html`<${Container} resolve=${resolve} reject=${reject}/>`, getOrCreateRoot());
};

// Some web applications break the mediaDevices capability
if (window.navigator.mediaDevices) {
  window.navigator.mediaDevices.getDisplayMedia = () => new Promise(getDisplayMedia);
}
