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

const isMisspelled = async word => {
  for (const dictionary of dictionaries) {
    const isCorrect = await dictionary.spell(word);
    if (isCorrect) {
      return false;
    }
  }
  return true;
};

globalThis.getMisspelled = async words => {
  if (dictionaries.length === 0) {
    return [];
  }
  const results = await Promise.all(words.map(isMisspelled));
  return words.filter((_, index) => results[index]);
};

globalThis.getSuggestions = async word => {
  const ret = new Set();
  const allSuggestions = await Promise.all(
    dictionaries.map(dictionary => dictionary.suggest(word))
  );
  for (const suggestion of allSuggestions.flat()) {
    ret.add(suggestion);
  }
  return Array.from(ret.values())
    .filter(w => w !== null)
    .sort((w1, w2) => w1.localeCompare(w2))
    .slice(0, 10);
};

globalThis.reloadDictionaries = async () => {
  dictionaries.length = 0;
  const {enabledDictionaries} = loadSettings();
  const loadedDictionaries = new Set();

  const loadPromises = [];

  for (const dictionaryKey of enabledDictionaries) {
    let dictionary;
    try {
      dictionary = require(`dictionary-${dictionaryKey.toLowerCase()}`);
    } catch {
      // Error is ignored
      continue;
    }

    if (dictionary) {
      // Convert callback-based dictionary loading to Promise
      const loadPromise = new Promise((resolve, reject) => {
        dictionary((err, {aff, dic}) => {
          if (err) {
            reject(err);
          } else {
            try {
              dictionaries.push(new Nodehun(aff, dic));
              loadedDictionaries.add(dictionaryKey);
              resolve();
            } catch (error) {
              reject(error);
            }
          }
        });
      }).catch(() => {
        // Error is ignored
      });

      loadPromises.push(loadPromise);
    }
  }

  await Promise.all(loadPromises);

  return loadedDictionaries;
};

