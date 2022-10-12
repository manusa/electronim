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
/* eslint-disable no-undef */
import {html, render, useLayoutEffect, useReducer, useState} from '../components/index.mjs';

const shouldUseDarkColors = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const getTabContainer = () => document.querySelector('.tab-container');
const getChromeTabs = () => getTabContainer().querySelector('.chrome-tabs');

const openMenu = event => {
  event.preventDefault();
  ipcRenderer.send(APP_EVENTS.appMenuOpen);
};
const sendTabsReady = () => ipcRenderer.send(APP_EVENTS.tabsReady, {});
const sendActivateTab = id => ipcRenderer.send(APP_EVENTS.activateTab, {id});
const sendReorderTabs = tabs =>
  ipcRenderer.send(APP_EVENTS.tabReorder, {tabIds: tabs.map(({id}) => id)});

const TRANSPARENT_GIF = new Image();
TRANSPARENT_GIF.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
const TAB_CONTENT_MARGIN = 9;
const TAB_CONTENT_OVERLAP_DISTANCE = 1;
const TAB_CONTENT_MAX_WIDTH = 240;

const ACTIONS = {
  ACTIVATE_TAB: 'ACTIVATE_TAB',
  MOVE_TAB: 'MOVE_TAB',
  SET_TAB_PROPERTY: 'SET_TAB_PROPERTY',
  SET_TABS: 'SET_TABS'
};

const initialState = {
  tabs: []
};

const reducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.ACTIVATE_TAB: {
      return {...state,
        tabs: state.tabs.map(tab => ({...tab, active: tab.id === action.payload}))
      };
    }
    case ACTIONS.MOVE_TAB: {
      const {id, idx, offsetX} = action.payload;
      const fromIdx = state.tabs.findIndex(t => t.id === id);
      const ret = {...state, tabs: [...state.tabs]};
      ret.tabs.forEach(t => (t.offsetX = 0));
      const tab = ret.tabs[fromIdx];
      tab.offsetX = offsetX;
      ret.tabs.splice(fromIdx, 1);
      ret.tabs.splice(idx, 0, tab);
      sendReorderTabs(ret.tabs);
      return ret;
    }
    case ACTIONS.SET_TAB_PROPERTY: {
      const {id, property, value} = action.payload;
      return {...state, tabs: state.tabs.map(tab => {
        if (tab.id === id) {
          const ret = {...tab};
          ret[property] = value;
          return ret;
        }
        return tab;
      })};
    }
    case ACTIONS.SET_TABS: {
      return {...state, tabs: [...action.payload]};
    }
    default: return state;
  }
};

const dispatchActivateTab = dispatch => id => dispatch({type: ACTIONS.ACTIVATE_TAB, payload: id});

const dispatchAddTabs = dispatch => (_event, tabs) => {
  dispatch({type: ACTIONS.SET_TABS, payload: tabs});
  const activeTabMeta = tabs.find(({active}) => active === true);
  if (tabs.length > 0 && activeTabMeta) {
    sendActivateTab(activeTabMeta.id);
  }
};

const dispatchSetTabTitle = dispatch => (_event, {id, title}) => {
  dispatch({type: ACTIONS.SET_TAB_PROPERTY, payload: {
    id, property: 'title', value: title
  }});
};

const dispatchSetTabFavicon = dispatch => (_event, {id, favicon}) => {
  dispatch({type: ACTIONS.SET_TAB_PROPERTY, payload: {
    id, property: 'favicon', value: favicon
  }});
};


const calculateTabWidth = numberOfTabs => {
  const availableWidth = (getChromeTabs() || getTabContainer()).clientWidth;
  const tabsCumulativeOverlappedWidth = (numberOfTabs - 1) * TAB_CONTENT_OVERLAP_DISTANCE;
  const targetWidth = (availableWidth - (2 * TAB_CONTENT_MARGIN) + tabsCumulativeOverlappedWidth) / numberOfTabs;
  return Math.min(TAB_CONTENT_MAX_WIDTH, Math.floor(targetWidth));
};

const calculateNewIndex = (numberOfTabs, currentX, originX, width, currentIndex) => {
  const offset = currentX - originX;
  const offsetIdx = Math.round(offset / width);
  return Math.min(numberOfTabs + 1, Math.max(0, currentIndex + offsetIdx));
};

const tabStyle = (width, idx, offsetX) =>
  `width: ${width + (2 * TAB_CONTENT_MARGIN) + TAB_CONTENT_OVERLAP_DISTANCE}px;` +
  `transform: translate3d(${(width) * idx}px, 0, 0);` +
  `left: ${offsetX}px`;

const isInVisibleArea = event =>
  event.clientX > 0 && event.clientY > 0 &&
  event.clientX <= window.innerWidth && event.clientY <= window.innerHeight;

const Favicon = ({favicon = ''}) => {
  const faviconProps = {hidden: true};
  if (favicon) {
    faviconProps.style = `background-image: url("${favicon}");`;
    delete faviconProps.hidden;
  }
  return html`<div class="chrome-tab-favicon" ...${faviconProps}></div>`;
};

const NotificationIcon = ({disableNotifications = false}) => disableNotifications && html`
  <div class="chrome-tab-notifications-mute">
    <i class="fas fa-bell-slash" />
  </div>
`;

const BackgroundSvgGeometryLeft = ({...props}) => html`
  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 214 36" ...${props}>
    <path d="M17 0h197v36H0v-2c4.5 0 9-3.5 9-8V8c0-4.5 3.5-8 8-8z"/>
    <clipPath id="crop"><rect class="mask" width="100%" height="100%" x="0"></rect></clipPath>
  </svg>
`;

const BackgroundSvg = () => html`
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg">
        <svg width="52%" height="100%">
            <${BackgroundSvgGeometryLeft} width="214" height="36" class="chrome-tab-geometry" />
        </svg>
        <g transform="scale(-1, 1)">
            <svg width="52%" height="100%" x="-100%" y="0">
                <${BackgroundSvgGeometryLeft} width="214" height="36" class="chrome-tab-geometry" />
            </svg>
        </g>
    </svg>
`;


const Tab = ({dispatch, numberOfTabs, idx, id, active, offsetX = 0, title, url, width, ...rest}) => {
  const tabClick = () => {
    if (active !== true) {
      sendActivateTab(id);
      dispatchActivateTab(dispatch)(id);
    }
  };
  const [draggedId, setDraggedId] = useState(id);
  const [originX, setOriginX] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(idx);
  const tabDrag = event => {
    const newIdx = calculateNewIndex(numberOfTabs, event.clientX, originX, width, currentIndex);
    let currentOffsetX = 0;
    if (isInVisibleArea(event) && event.type === 'drag') {
      currentOffsetX = (event.clientX - originX) + (width * (idx - newIdx));
    }
    dispatch({type: ACTIONS.MOVE_TAB, payload: {
      id: draggedId,
      idx: isInVisibleArea(event) ? newIdx : idx,
      offsetX: currentOffsetX
    }});
  };
  const props = {
    'data-tab-id': id,
    draggable: true,
    onDragStart: event => {
      tabClick();
      event.dataTransfer.setDragImage(TRANSPARENT_GIF, 0, 0);
      setOriginX(event.clientX);
      setDraggedId(id);
      setCurrentIndex(idx);
    },
    onDrag: tabDrag,
    onDragEnd: tabDrag,
    style: tabStyle(width, idx, offsetX),
    onClick: tabClick
  };
  if (active === true) {
    props.active = '';
  }
  return html`
    <div class="chrome-tab" ...${props}>
      <div class="chrome-tab-dividers"></div>
      <div class="chrome-tab-background">
        <${BackgroundSvg} />
      </div>
      <div class="chrome-tab-content">
        <${Favicon} ...${rest}/>
        <div class="chrome-tab-title" title=${url}>
          ${title ? title : url}
        </div>
        <${NotificationIcon} ...${rest}/>
      </div>
    </div>
  `;
};

const ChromeTabs = ({dispatch, state: {tabs}}) => {
  const [width, setWidth] = useState(calculateTabWidth(tabs.length));
  const applyWidth = () => setWidth(calculateTabWidth(tabs.length));
  useLayoutEffect(() => {
    window.addEventListener('resize', applyWidth);
    return () => window.removeEventListener('resize', applyWidth);
  });
  return html`
    <div
      class=${`chrome-tabs ${shouldUseDarkColors() ? 'chrome-tabs-dark-theme' : ''}`}
      style=${`--tab-content-margin: ${TAB_CONTENT_MARGIN}px`}
      ondragover=${event => event.preventDefault()}
    >
      <div class="chrome-tabs-content">
        ${tabs.map((tab, idx) => html`
          <${Tab} ...${{...tab, dispatch, numberOfTabs: tabs.length, idx, width}}/>`)}
      </div>
    </div>
  `;
};

const Menu = () => html`
 <div class="menu">
     <button
        class="menu__button button"
        onClick=${openMenu}
      >
         <span class='icon'>
           <em class='fas fa-bars'></em>
         </span>
     </button>
 </div>
`;

const TabContainer = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  useLayoutEffect(() => {
    ipcRenderer.on(APP_EVENTS.addTabs, dispatchAddTabs(dispatch));
    ipcRenderer.on(APP_EVENTS.activateTabInContainer,
      (_event, {tabId}) => dispatchActivateTab(dispatch)(tabId));
    ipcRenderer.on(APP_EVENTS.setTabTitle, dispatchSetTabTitle(dispatch));
    ipcRenderer.on(APP_EVENTS.setTabFavicon, dispatchSetTabFavicon(dispatch));
    sendTabsReady();
  }, []);
  return html`
    <${ChromeTabs} state=${state} dispatch=${dispatch}/>
    <${Menu}/>
  `;
};

render(html`<${TabContainer} />`, getTabContainer());
