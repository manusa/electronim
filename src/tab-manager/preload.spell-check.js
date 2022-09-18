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
const {ipcRenderer, webFrame} = require('electron');

const spellCheckFunction = async (words, callback) => {
  // eslint-disable-next-line no-undef
  const misspelled = await ipcRenderer.invoke(APP_EVENTS.dictionaryGetMisspelled, words);
  callback(misspelled);
};

const initSpellChecker = () => new Promise(resolve => {
  ipcRenderer.invoke(APP_EVENTS.settingsLoad)
    .then(settings => {
      if (!settings.useNativeSpellChecker) {
        webFrame.setSpellCheckProvider(navigator.language, {spellCheck: spellCheckFunction});
      }
      resolve();
    })
    .catch(initSpellChecker);
});

module.exports = {initSpellChecker};
