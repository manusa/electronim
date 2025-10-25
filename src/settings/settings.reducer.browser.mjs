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
  TOGGLE_DICTIONARY: 'TOGGLE_DICTIONARY',
  TOGGLE_PROPERTY: 'TOGGLE_PROPERTY',
  TOGGLE_TAB_EXPANDED: 'TOGGLE_TAB_EXPANDED',
  TOGGLE_TAB_PROPERTY: 'TOGGLE_TAB_PROPERTY',
  UPDATE_NEW_TAB_VALUE: 'UPDATE_NEW_TAB_VALUE'
};

// Selectors
export const canCancel = state => state.canCancel ?? false;
export const canSave = state => state.canSave ?? false;
export const isPaneActive = state => paneId => state.activePane === paneId;
export const closeButtonBehavior = state => state.closeButtonBehavior;
export const theme = state => state.theme;
export const applicationTitle = state => state.applicationTitle;
export const useNativeSpellChecker = state => state.useNativeSpellChecker;
export const keyboardShortcuts = state => state.keyboardShortcuts;
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

// Action handlers
const handleActivatePane = (state, action) => ({...state, activePane: action.payload});

const handleAdd = state => {
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
      openUrlsInApp: false,
      disableNotifications: false,
      url: prependProtocol(state.newTabValue)
    }],
    canSave: true
  };
};

const handleRemove = (state, action) => {
  const filteredTabs = state.tabs.filter(tab => tab.id !== action.payload.id);
  return {...state,
    tabs: filteredTabs,
    canSave: filteredTabs.length > 0
  };
};

const handleSetTabProperty = (state, action) => {
  const newState = {...state, tabs: []};
  for (const tab of state.tabs) {
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
  }
  return newState;
};

const handleSetProperty = (state, action) => ({
  ...state,
  [action.payload.property]: action.payload.value
});

const handleToggleDictionary = (state, action) => {
  const enabled = dictionariesEnabled(state);
  const newEnabled = enabled.includes(action.payload)
    ? enabled.filter(key => key !== action.payload)
    : [...enabled, action.payload];

  return {
    ...state,
    dictionaries: {
      ...state.dictionaries,
      enabled: newEnabled
    }
  };
};

const handleToggleProperty = (state, action) => ({
  ...state,
  [action.payload.property]: !state[action.payload.property]
});

const handleToggleTabExpanded = (state, action) => {
  const expandedTabs = state.expandedTabs.includes(action.payload)
    ? state.expandedTabs.filter(id => id !== action.payload)
    : [...state.expandedTabs, action.payload];

  return {...state, expandedTabs};
};

const handleToggleTabProperty = (state, action) => {
  const tabs = state.tabs.map(tab => {
    if (tab.id === action.payload.id) {
      return {...tab, [action.payload.property]: !tab[action.payload.property]};
    }
    return tab;
  });

  return {...state, tabs};
};

const handleUpdateNewTabValue = (state, action) => ({
  ...state,
  newTabValid: validateUrl(action.payload),
  newTabValue: action.payload,
  canSave: action.payload.length === 0 && state.tabs.length > 0
});

// Action handlers map
const actionHandlers = {
  [ACTIONS.ACTIVATE_PANE]: handleActivatePane,
  [ACTIONS.ADD]: handleAdd,
  [ACTIONS.REMOVE]: handleRemove,
  [ACTIONS.SET_TAB_PROPERTY]: handleSetTabProperty,
  [ACTIONS.SET_PROPERTY]: handleSetProperty,
  [ACTIONS.TOGGLE_DICTIONARY]: handleToggleDictionary,
  [ACTIONS.TOGGLE_PROPERTY]: handleToggleProperty,
  [ACTIONS.TOGGLE_TAB_EXPANDED]: handleToggleTabExpanded,
  [ACTIONS.TOGGLE_TAB_PROPERTY]: handleToggleTabProperty,
  [ACTIONS.UPDATE_NEW_TAB_VALUE]: handleUpdateNewTabValue
};

export const reducer = (state, action) => {
  const handler = actionHandlers[action.type];
  return handler ? handler(state, action) : state;
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
export const toggleProperty = ({dispatch, property}) =>
  () => dispatch({type: ACTIONS.TOGGLE_PROPERTY, payload: {property}});
export const toggleTabProperty = (dispatch, property, id) =>
  () => dispatch({type: ACTIONS.TOGGLE_TAB_PROPERTY, payload: {id, property}});
