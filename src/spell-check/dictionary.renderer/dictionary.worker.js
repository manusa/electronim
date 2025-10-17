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
const Nodehun = require('nodehun');
const {loadSettings} = require('../../settings');

const dictionaries = [];

const isMisspelled = word =>
  dictionaries.every(dictionary => !dictionary.spellSync(word));

window.getMisspelled = words => {
  if (dictionaries.length === 0) {
    return [];
  }
  return words.filter(isMisspelled);
};

window.getSuggestions = word => {
  const ret = new Set();
  const allSuggestions = dictionaries.map(dictionary => dictionary.suggestSync(word))
    .flatMap(suggestions => suggestions);
  for (const suggestion of allSuggestions) {
    ret.add(suggestion);
  }
  return Array.from(ret.values()).sort((w1, w2) => w1.localeCompare(w2)).slice(0, 10);
};

window.reloadDictionaries = () => {
  dictionaries.length = 0;
  const {enabledDictionaries} = loadSettings();
  for (const dictionaryKey of enabledDictionaries) {
    let dictionary;
    try {
      dictionary = require(`dictionary-${dictionaryKey.toLowerCase()}`);
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      // Error is ignored
    }
    if (dictionary) {
      dictionary((_err, {aff, dic}) => {
        dictionaries.push(new Nodehun(aff, dic));
      });
    }
  }
};

