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
import {Card, Checkbox, html} from '../components/index.mjs';
import {
  dictionaries,
  dictionariesEnabled,
  toggleUseNativeSpellChecker,
  toggleDictionary,
  useNativeSpellChecker, isPaneActive
} from './settings.reducer.browser.mjs';
import {SettingsOption} from './settings.common.browser.mjs';

const LanguageEntry = ({dispatch, languageKey, name, enabled = false}) => html`
  <div className='settings__language-entry'>
    <${Checkbox} label=${`${name} (${languageKey})`}
      checked=${enabled} value=${languageKey}
      onClick=${toggleDictionary({dispatch, languageKey})}
    />
  </div>
`;

export const SpellCheckPane = ({dispatch, state}) => {
  const useNative = useNativeSpellChecker(state);
  const enabledDictionaries = dictionariesEnabled(state);
  return isPaneActive(state)(SpellCheckPane.id) && html`
    <h2 class='title'>Spell check</h2>
    <${Card} className='settings__spell-check'>
      <${SettingsOption}
          className='settings__use-native-spell-checker'
          label='Use Native Spell Checker'
          checked=${useNative}
          onClick=${toggleUseNativeSpellChecker({dispatch})}
      />
      <${Card.Divider} />
      <div class='settings__dictionaries'>${
  Object.entries(dictionaries(state))
    .sort(([, {name: name1}], [, {name: name2}]) => name1.localeCompare(name2))
    .map(([key, {name}]) => (html`
      <${LanguageEntry} dispatch=${dispatch} languageKey=${key} name=${name}
        enabled=${enabledDictionaries.includes(key)}
      />
    `))}
      </div>
    </${Card}>
  `;
};

SpellCheckPane.id = 'spell-check';
