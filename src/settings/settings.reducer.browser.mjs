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
import {newId, prependProtocol, validateUrl} from './settings.common.browser.mjs';

export const ACTIONS = {
  ACTIVATE_PANE: 'ACTIVATE_PANE',
  ADD: 'ADD',
  REMOVE: 'REMOVE',
  SET_PROPERTY: 'SET_PROPERTY',
  SET_TAB_PROPERTY: 'SET_TAB_PROPERTY',
  TOGGLE_USE_NATIVE_SPELL_CHECKER: 'TOGGLE_USE_NATIVE_SPELL_CHECKER',
  TOGGLE_DICTIONARY: 'TOGGLE_DICTIONARY',
  TOGGLE_GLOBAL_NOTIFICATIONS: 'TOGGLE_GLOBAL_NOTIFICATIONS',
  TOGGLE_TAB_EXPANDED: 'TOGGLE_TAB_EXPANDED',
  TOGGLE_TAB_PROPERTY: 'TOGGLE_TAB_PROPERTY',
  TOGGLE_TRAY: 'TOGGLE_TRAY',
  UPDATE_NEW_TAB_VALUE: 'UPDATE_NEW_TAB_VALUE'
};

// Selectors
export const canCancel = state => state.canCancel ?? false;
export const canSave = state => state.canSave ?? false;
export const isPaneActive = state => paneId => state.activePane === paneId;
export const closeButtonBehavior = state => state.closeButtonBehavior;
export const theme = state => state.theme;
export const useNativeSpellChecker = state => state.useNativeSpellChecker;
export const dictionariesEnabled = state => state.dictionaries.enabled;
const dictionariesAvailableNative = state => state.dictionaries.availableNative;
const dictionariesAvailable = state => state.dictionaries.available;
export const dictionaries = state => {
  if (useNativeSpellChecker(state)) {
    return Object.entries(dictionariesAvailable(state))
      .filter(([key]) => dictionariesAvailableNative(state).includes(key))
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
  }
  return dictionariesAvailable(state);
};

export const reducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.ACTIVATE_PANE: {
      return {...state, activePane: action.payload};
    }
    case ACTIONS.ADD: {
      if (!validateUrl(state.newTabValue)) {
        return {...state};
      }
      return {...state,
        newTabValid: false,
        newTabValue: '',
        tabs: [...state.tabs, {
          id: newId(),
          disabled: false,
          sandboxed: false,
          disableNotifications: false,
          url: prependProtocol(state.newTabValue)
        }],
        canSave: true
      };
    }
    case ACTIONS.REMOVE: {
      return {...state,
        tabs: state.tabs.filter(tab => tab.id !== action.payload.id),
        canSave: state.tabs.filter(tab => tab.id !== action.payload.id).length > 0
      };
    }
    case ACTIONS.SET_TAB_PROPERTY: {
      const newState = {...state, tabs: []};
      state.tabs.forEach(tab => {
        const newTab = {...tab};
        if (newTab.id === action.payload.id) {
          newTab[action.payload.property] = action.payload.value;
          if (!validateUrl(newTab.url, false)) {
            newState.invalidTabs.add(newTab.id);
          } else {
            newState.invalidTabs.delete(newTab.id);
          }
        }
        newState.tabs.push(newTab);
      });
      return newState;
    }
    case ACTIONS.SET_PROPERTY: {
      const newState = {...state};
      newState[action.payload.property] = action.payload.value;
      return newState;
    }
    case ACTIONS.TOGGLE_USE_NATIVE_SPELL_CHECKER: {
      return {...state,
        useNativeSpellChecker: !state.useNativeSpellChecker
      };
    }
    case ACTIONS.TOGGLE_DICTIONARY: {
      const newState = {...state};
      if (dictionariesEnabled(newState).includes(action.payload)) {
        newState.dictionaries.enabled = [...dictionariesEnabled(newState)
          .filter(key => key !== action.payload)];
      } else {
        newState.dictionaries.enabled = [...dictionariesEnabled(newState), action.payload];
      }
      return newState;
    }
    case ACTIONS.TOGGLE_TAB_EXPANDED: {
      if (state.expandedTabs.includes(action.payload)) {
        return {...state,
          expandedTabs: state.expandedTabs.filter(id => id !== action.payload)};
      }
      return {...state,
        expandedTabs: [...state.expandedTabs, action.payload]
      };
    }
    case ACTIONS.TOGGLE_TAB_PROPERTY: {
      const newState = {...state, tabs: []};
      state.tabs.forEach(tab => {
        const newTab = {...tab};
        if (newTab.id === action.payload.id) {
          newTab[action.payload.property] = !newTab[action.payload.property];
        }
        newState.tabs.push(newTab);
      });
      return newState;
    }
    case ACTIONS.TOGGLE_GLOBAL_NOTIFICATIONS: {
      return {...state,
        disableNotificationsGlobally: !state.disableNotificationsGlobally
      };
    }
    case ACTIONS.TOGGLE_TRAY: {
      return {...state,
        trayEnabled: !state.trayEnabled
      };
    }
    case ACTIONS.UPDATE_NEW_TAB_VALUE: {
      return {...state,
        newTabValid: validateUrl(action.payload),
        newTabValue: action.payload,
        canSave: action.payload.length === 0 && state.tabs.length > 0
      };
    }
    default: return {...state};
  }
};

// Action creators
export const activatePane = ({dispatch}) =>
  paneId => dispatch({type: ACTIONS.ACTIVATE_PANE, payload: paneId});
export const addTab = ({dispatch}) =>
  () => dispatch({type: ACTIONS.ADD});
export const setTabProperty = ({dispatch, property, value, id}) =>
  dispatch({type: ACTIONS.SET_TAB_PROPERTY, payload: {id, property, value}});
export const setProperty = ({dispatch}) =>
  ({property, value}) => dispatch({type: ACTIONS.SET_PROPERTY, payload: {property, value}});
export const toggleDictionary = ({dispatch, languageKey}) =>
  () => dispatch({type: ACTIONS.TOGGLE_DICTIONARY, payload: languageKey});
export const toggleNotifications = ({dispatch}) =>
  () => dispatch({type: ACTIONS.TOGGLE_GLOBAL_NOTIFICATIONS});
export const toggleTabProperty = (dispatch, property, id) =>
  () => dispatch({type: ACTIONS.TOGGLE_TAB_PROPERTY, payload: {id, property}});
export const toggleTray = ({dispatch}) =>
  () => dispatch({type: ACTIONS.TOGGLE_TRAY});
export const toggleUseNativeSpellChecker = ({dispatch}) =>
  () => dispatch({type: ACTIONS.TOGGLE_USE_NATIVE_SPELL_CHECKER});
