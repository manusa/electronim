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
import {
  html, render, useLayoutEffect, useReducer, useState, Icon, IconButton
} from '../components/index.mjs';
import {
  initialState, reducer, activateService, addServices, moveTab, setNewVersionAvailable,
  setServiceDisableNotifications, setServiceFavicon, setServiceTitle, sendActivateService
} from './chrome-tabs.reducer.browser.mjs';

const shouldUseDarkColors = () => globalThis?.matchMedia?.('(prefers-color-scheme: dark)').matches;
const query = () => new URLSearchParams(globalThis.location.search);
const isVertical = () => query().get('tabPosition') === 'left';
const getTabContainer = () => document.querySelector('.tab-container');
const getChromeTabs = () => getTabContainer().querySelector('.chrome-tabs');

const openMenu = event => {
  event.preventDefault();
  globalThis.electron.appMenuOpen();
};
const sendServicesReady = () => globalThis.electron.servicesReady();

const TRANSPARENT_GIF = new Image();
TRANSPARENT_GIF.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
const TAB_CONTENT_MARGIN = 9;
const TAB_CONTENT_OVERLAP_DISTANCE = 1;
const TAB_CONTENT_MAX_WIDTH = 240;

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
  event.clientX <= globalThis.innerWidth && event.clientY <= globalThis.innerHeight;

// Icon candidates in order of preference: the custom icon set in the settings, then the favicon reported by the
// service. Each one that fails to load is skipped. Favicons need crossorigin (CORP headers, #454), custom icons are
// plain image requests so that hosts without CORS headers work too.
const useIcon = ({customIcon, favicon}) => {
  const [failed, setFailed] = useState([]);
  const [icon] = [
    {src: customIcon, crossOrigin: null},
    {src: favicon, crossOrigin: 'anonymous'}
  ].filter(({src}) => src && !failed.includes(src));
  return icon && {...icon, onError: () => setFailed(previous => [...previous, icon.src])};
};

// Most services prefix their title with the unread count, e.g. "(3) WhatsApp"
const UNREAD_COUNT_REGEX = /^\((\d+)\)/;
const MAX_UNREAD_COUNT = 99;
const unreadCount = (title = '') => {
  const count = Number(UNREAD_COUNT_REGEX.exec(title)?.[1] ?? 0);
  if (count <= 0) {
    return '';
  }
  return count > MAX_UNREAD_COUNT ? `${MAX_UNREAD_COUNT}+` : `${count}`;
};

const Favicon = ({customIcon, favicon}) => {
  const icon = useIcon({customIcon, favicon});
  let img = html``;
  if (icon) {
    img = html`
      <img class="chrome-tab-favicon-icon" crossorigin=${icon.crossOrigin} src="${icon.src}" alt="" role="presentation"
        onError=${icon.onError}/>
    `;
  }
  return html`
      <div class="chrome-tab-favicon">
          ${img}
      </div>`;
};

const NotificationIcon = ({disableNotifications = false}) => disableNotifications && html`
  <${Icon} className='chrome-tab-notifications-mute'>${Icon.notificationsOff}</${Icon}>
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

const clickTab = ({dispatch, id, active}) => () => {
  if (active !== true) {
    sendActivateService({id, restoreWindow: true});
    activateService({dispatch})(null, {tabId: id});
  }
};

const Tab = ({dispatch, numberOfTabs, idx, id, active, offsetX = 0, title, url, customName, width, ...rest}) => {
  const tabClick = clickTab({dispatch, id, active});
  const [draggedId, setDraggedId] = useState(id);
  const [originX, setOriginX] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(idx);
  const tabDrag = event => {
    const newIdx = calculateNewIndex(numberOfTabs, event.clientX, originX, width, currentIndex);
    let currentOffsetX = 0;
    if (isInVisibleArea(event) && event.type === 'drag') {
      currentOffsetX = (event.clientX - originX) + (width * (idx - newIdx));
    }
    moveTab({dispatch})({
      id: draggedId,
      idx: isInVisibleArea(event) ? newIdx : idx,
      offsetX: currentOffsetX
    });
  };
  const displayTitle = customName || title || url;
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
          ${displayTitle}
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
    globalThis.addEventListener('resize', applyWidth);
    return () => globalThis.removeEventListener('resize', applyWidth);
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

const hostname = url => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const VerticalTabIcon = ({customIcon, favicon, name}) => {
  const icon = useIcon({customIcon, favicon});
  if (icon) {
    return html`
      <img class="vertical-tab__icon" crossorigin=${icon.crossOrigin} src="${icon.src}" alt="" role="presentation"
        onError=${icon.onError}/>
    `;
  }
  const initial = name.match(/[\p{L}\p{N}]/u)?.[0] ?? '';
  return html`<div class="vertical-tab__icon vertical-tab__icon--placeholder">${initial}</div>`;
};

const REORDER_KEYS = {ArrowUp: -1, ArrowDown: 1};

const focusVerticalTab = id => document
  .querySelector(`.vertical-tab[data-tab-id=${JSON.stringify(String(id))}]`)?.focus();

const VerticalTab = ({
  dispatch, idx, numberOfTabs, draggedId, setDraggedId,
  id, active, title, url, customName, disableNotifications = false, ...rest
}) => {
  const displayTitle = customName || title || url || '';
  const name = customName || title?.replace(UNREAD_COUNT_REGEX, '') || hostname(url ?? '');
  const badge = unreadCount(title);
  const label = [displayTitle, badge && `${badge} unread`, disableNotifications && 'notifications off']
    .filter(Boolean).join(', ');
  const props = {
    'data-tab-id': id,
    title: displayTitle,
    'aria-label': label,
    onClick: clickTab({dispatch, id, active}),
    draggable: true,
    onDragStart: event => {
      event.dataTransfer.effectAllowed = 'move';
      setDraggedId(id);
    },
    onDragEnd: () => setDraggedId(null),
    // The dragged service takes the place of the one under the pointer (moveTab persists the new order)
    onDragOver: event => {
      if (draggedId === null) {
        return;
      }
      event.preventDefault();
      if (draggedId !== id) {
        moveTab({dispatch})({id: draggedId, idx, offsetX: 0});
      }
    },
    onDrop: event => event.preventDefault(),
    // Keyboard alternative to drag and drop: Alt+ArrowUp / Alt+ArrowDown
    onKeyDown: event => {
      const newIdx = idx + (REORDER_KEYS[event.key] ?? 0);
      if (event.altKey && newIdx !== idx && newIdx >= 0 && newIdx < numberOfTabs) {
        event.preventDefault();
        moveTab({dispatch})({id, idx: newIdx, offsetX: 0});
        // Moving the button in the DOM loses its focus
        setTimeout(() => focusVerticalTab(id));
      }
    }
  };
  if (active === true) {
    props['aria-current'] = 'page';
  }
  const className = ['vertical-tab', active === true && 'vertical-tab--active', draggedId === id && 'vertical-tab--dragging']
    .filter(Boolean).join(' ');
  return html`
    <button type="button" class=${className} ...${props}>
      <${VerticalTabIcon} ...${rest} name=${name} />
      ${badge && html`<span class="vertical-tab__badge">${badge}</span>`}
      ${disableNotifications && html`
        <${Icon} className='vertical-tab__notifications-mute'>${Icon.notificationsOff}</${Icon}>`}
    </button>
  `;
};

const VerticalTabs = ({dispatch, state: {tabs}}) => {
  const [draggedId, setDraggedId] = useState(null);
  const tabProps = (tab, idx) => ({...tab, dispatch, idx, numberOfTabs: tabs.length, draggedId, setDraggedId});
  return html`
    <div class="vertical-tabs" onDragOver=${event => draggedId !== null && event.preventDefault()}>
      ${tabs.map((tab, idx) => html`<${VerticalTab} key=${tab.id} ...${tabProps(tab, idx)}/>`)}
    </div>
  `;
};

const Menu = ({state: {newVersionAvailable}}) => {
  const icon = newVersionAvailable ? Icon.arrowCircleUp : Icon.moreVert;
  return html`
    <${IconButton}
      icon=${icon} className='menu__button' onClick=${openMenu}
      title=${newVersionAvailable ? 'New ElectronIM version is available' : ''}
    />
  `;
};

const TabContainer = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  useLayoutEffect(() => {
    globalThis.electron.onAddServices(tabs => addServices({dispatch})(null, tabs));
    globalThis.electron.onActivateServiceInContainer(data => activateService({dispatch})(null, data));
    globalThis.electron.onElectronimNewVersionAvailable(
      data => setNewVersionAvailable({dispatch})(null, data));
    globalThis.electron.onSetServiceDisableNotifications(
      data => setServiceDisableNotifications({dispatch})(null, data));
    globalThis.electron.onSetServiceFavicon(data => setServiceFavicon({dispatch})(null, data));
    globalThis.electron.onSetServiceTitle(data => setServiceTitle({dispatch})(null, data));
    sendServicesReady();
  }, []);
  const Tabs = isVertical() ? VerticalTabs : ChromeTabs;
  return html`
      <${Tabs} state=${state} dispatch=${dispatch}/>
          <${Menu} state=${state}/>
  `;
};

if (isVertical()) {
  getTabContainer().classList.add('tab-container--vertical');
  const iconSize = Number(query().get('tabIconSize'));
  if (iconSize > 0) {
    getTabContainer().style.setProperty('--vertical-tab-icon-size', `${iconSize}px`);
  }
}
render(html`<${TabContainer} />`, getTabContainer());
