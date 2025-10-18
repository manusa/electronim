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
/* eslint-disable no-undef */
import {APP_EVENTS} from '../components/index.mjs';
export const sendActivateService = ({id, restoreWindow = true}) => {
  ipcRenderer.send(APP_EVENTS.activateService, {id, restoreWindow});
};
const sendReorderServices = tabs =>
  ipcRenderer.send(APP_EVENTS.servicesReorder, {tabIds: tabs.map(({id}) => id)});

export const initialState = {
  tabs: [],
  newVersionAvailable: false
};

const ACTIONS = {
  ACTIVATE_SERVICE: 'ACTIVATE_SERVICE',
  MOVE_TAB: 'MOVE_TAB',
  SET_NEW_VERSION_AVAILABLE: 'SET_NEW_VERSION_AVAILABLE',
  SET_TAB_PROPERTY: 'SET_TAB_PROPERTY',
  SET_TABS: 'SET_TABS'
};

export const reducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.ACTIVATE_SERVICE: {
      return {...state,
        tabs: state.tabs.map(tab => ({...tab, active: tab.id === action.payload}))
      };
    }
    case ACTIONS.MOVE_TAB: {
      const {id, idx, offsetX} = action.payload;
      const fromIdx = state.tabs.findIndex(t => t.id === id);
      const ret = {...state, tabs: [...state.tabs]};
      for (const t of ret.tabs) {
        t.offsetX = 0;
      }
      const tab = ret.tabs[fromIdx];
      tab.offsetX = offsetX;
      ret.tabs.splice(fromIdx, 1);
      ret.tabs.splice(idx, 0, tab);
      sendReorderServices(ret.tabs);
      return ret;
    }
    case ACTIONS.SET_NEW_VERSION_AVAILABLE: {
      return {...state, newVersionAvailable: action.payload};
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

// Action creators
export const activateService = ({dispatch}) => (_event, {tabId}) =>
  dispatch({type: ACTIONS.ACTIVATE_SERVICE, payload: tabId});
export const addServices = ({dispatch}) => (_event, tabs) => {
  dispatch({type: ACTIONS.SET_TABS, payload: tabs});
  const activeServiceMeta = tabs.find(({active}) => active === true);
  if (tabs.length > 0 && activeServiceMeta) {
    sendActivateService({id: activeServiceMeta.id, restoreWindow: false});
  }
};
export const moveTab = ({dispatch}) => ({id, idx, offsetX}) =>
  dispatch({type: ACTIONS.MOVE_TAB, payload: {id, idx, offsetX}});
export const setNewVersionAvailable = ({dispatch}) => (_event, newVersionAvailable) => {
  dispatch({type: ACTIONS.SET_NEW_VERSION_AVAILABLE, payload: newVersionAvailable});
};
export const setServiceFavicon = ({dispatch}) => (_event, {id, favicon}) => {
  dispatch({type: ACTIONS.SET_TAB_PROPERTY, payload: {
    id, property: 'favicon', value: favicon
  }});
};
export const setServiceNotificationStatus = ({dispatch}) => (_event, {id, disableNotifications}) => {
  dispatch({type: ACTIONS.SET_TAB_PROPERTY, payload: {
    id, property: 'disableNotifications', value: disableNotifications
  }});
};
export const setServiceTitle = ({dispatch}) => (_event, {id, title}) => {
  dispatch({type: ACTIONS.SET_TAB_PROPERTY, payload: {
    id, property: 'title', value: title
  }});
};
