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

// Electron's SpellCheckClient tracks a single pending request, and dereferences it unchecked when a
// callback runs. Answering a request that is no longer the pending one completes the wrong request,
// and the next answer finds nothing pending: the renderer segfaults and the service turns blank.
// Blink supersedes requests routinely since Chromium 152 (Electron 44). It cancels its in-flight check
// whenever a script moves the caret in a field the user didn't focus themselves (Slack and Telegram
// focus their composers by script), and issues a new one on the next keystroke.
// So only the most recent request is ever answered, exactly once, and only when the renderer is idle.
// Electron hands a request over to this function from a task it posts, so Blink may have issued a
// request that hasn't reached it yet. That task has normal priority and always runs before an idle
// callback, which then finds its own request superseded.
let pendingRequest = null;

const spellCheckFunction = (words, callback) => {
  const request = {};
  pendingRequest = request;
  const answer = misspelled => requestIdleCallback(() => {
    if (pendingRequest !== request) {
      return;
    }
    pendingRequest = null;
    try {
      callback(misspelled);
    } catch (error) {
      // Blink's side of the contract breaking. The request is no longer pending, so it can't be
      // answered twice, only reported.
      console.error('Spell check callback failed', error);
    }
  });
  ipcRenderer.invoke(APP_EVENTS.dictionaryGetMisspelled, words)
    // Blink keeps the request pending until the callback runs, so a rejection (the dictionary
    // renderer failing to load, say) must still answer, reporting nothing as misspelled.
    .then(answer, () => answer([]));
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
