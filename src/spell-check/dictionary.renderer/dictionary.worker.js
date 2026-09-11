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
const fs = require('node:fs/promises');
const path = require('node:path');
const Nodehun = require('nodehun');
const {loadSettings} = require('../../settings');

const dictionaries = [];

// nodehun@3.0.2 reads the affix and dictionary buffers as NUL-terminated C strings, but Node
// Buffers carry no terminator. Hunspell therefore parses past the end of the data into whatever
// follows it on the heap, and intermittently ends up with a broken affix table. The damage is
// decided when the instance is built and never heals, and it cuts both ways:
//   - false positives: affix-derived forms (such as 'casa' in Italian, which is not a literal .dic
//     entry) are reported as misspelled, while literal entries keep working;
//   - false negatives: adjacent heap bytes are parsed as dictionary entries, so they are accepted
//     as correctly spelled words and can be handed back as suggestions, leaking process memory
//     into a context menu label.
// Hand over NUL-terminated copies so the parse always stops at the end of the data.
const nullTerminated = data => {
  const terminated = Buffer.alloc(data.length + 1);
  terminated.set(data);
  return terminated;
};

// Every dictionary-* package ships its Hunspell data as index.aff and index.dic next to its entry
// point, and declares both in package.json "files". Read them by path instead of going through the
// package's own API.
//
// Going through the API does not survive packaging. The newer ESM majors read their own data with
// fs.readFile(new URL('index.aff', import.meta.url)), and Electron's asar support does not patch
// the fs calls that take a URL, so inside app.asar they fail with ENOTDIR and importing the package
// throws. That is invisible from the source tree, where there is no archive and both forms work.
// String paths are covered by the asar patch and require.resolve finds the package inside the
// archive, so this works packaged and unpackaged alike. It also keeps the data out of a module
// scope, so the buffers can be collected once Hunspell has parsed them.
const loadDictionaryData = async dictionaryKey => {
  const dictionaryPath = path.dirname(require.resolve(`dictionary-${dictionaryKey.toLowerCase()}`));
  const [aff, dic] = await Promise.all([
    fs.readFile(path.join(dictionaryPath, 'index.aff')),
    fs.readFile(path.join(dictionaryPath, 'index.dic'))
  ]);
  return {aff, dic};
};

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
    const loadPromise = loadDictionaryData(dictionaryKey)
      .then(({aff, dic}) => {
        dictionaries.push(new Nodehun(nullTerminated(aff), nullTerminated(dic)));
        loadedDictionaries.add(dictionaryKey);
      })
      .catch(error => {
        // Skip the dictionary, but say so. getMisspelled returns an empty list when nothing is
        // loaded, which makes a total load failure look exactly like a document with no mistakes.
        console.error(`Dictionary "${dictionaryKey}" could not be loaded and will be skipped`, error);
      });

    loadPromises.push(loadPromise);
  }

  await Promise.all(loadPromises);

  return loadedDictionaries;
};

