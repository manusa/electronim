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

const spellCheckFunction = (words, callback) => {
  ipcRenderer.invoke(APP_EVENTS.dictionaryGetMisspelled, words)
    // Blink keeps the request pending until the callback runs, so a rejection (the dictionary
    // renderer failing to load, say) must still answer, reporting nothing as misspelled. The
    // rejection handler is passed to then rather than chained through catch, which would also
    // catch a throw from the callback itself and answer the same request a second time.
    .then(misspelled => callback(misspelled), () => callback([]))
    // Only ever reached if the callback itself threw, which is Blink's side of the contract
    // breaking. Report it rather than leaving an unhandled rejection, and never answer again.
    .catch(error => console.error('Spell check callback failed', error));
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
