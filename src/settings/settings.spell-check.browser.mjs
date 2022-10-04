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
const {html} = window;

import {Checkbox, Panel} from '../components/index.mjs';
import {
  dictionaries,
  dictionariesEnabled,
  toggleUseNativeSpellChecker,
  toggleDictionary,
  useNativeSpellChecker
} from './settings.reducer.browser.mjs';

const LanguageEntry = ({dispatch, languageKey, name, enabled = false}) => html`
  <${Checkbox} label=${`${name} (${languageKey})`} checked=${enabled}
    value=${languageKey}
    onClick=${toggleDictionary({dispatch, languageKey})}
  />
`;

export const SpellCheckContainer = ({dispatch, state}) => {
  const useNative = useNativeSpellChecker(state);
  const enabledDictionaries = dictionariesEnabled(state);
  return html`
    <${Panel} heading='Spell check' className='settings__spell-check'>
      <${Panel.Block} className='settings__spell-check-common'>
        <${Checkbox}
            label='Use Native Spell Checker' checked=${useNative} value=${useNative}
            onClick="${toggleUseNativeSpellChecker({dispatch})}"
            data-testid='use-native-spell-checker'
        />
      </${Panel.Block} >
      <${Panel.Block} >
        <div class="settings__dictionaries container">${
  Object.entries(dictionaries(state))
    .sort(([, {name: name1}], [, {name: name2}]) => name1.localeCompare(name2))
    .map(([key, {name}]) => (html`
      <${LanguageEntry} dispatch=${dispatch} languageKey=${key} name=${name}
        enabled=${enabledDictionaries.includes(key)}
      />
    `))}
        </div>
      </${Panel.Block} >
    </${Panel}>
  `;
};
