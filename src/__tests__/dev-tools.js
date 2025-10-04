/*
   Copyright 2025 Marc Nuri San Felix

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
const chromeRemoteInterface = require('chrome-remote-interface');
const {List: listTargets} = chromeRemoteInterface;

const sleep = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

const devTools = ({port, timeout = 10000}) => {
  const instance = {
    port,
    connected: false
  };
  instance.close = async () => {
    if (!instance.client) {
      return;
    }
    try {
      await instance.client.close();
    } catch {
      // Ignore close errors
    }
  };
  instance.connect = async () => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        const targets = await listTargets({port}, null);
        if (targets.length > 0) {
          instance.connected = true;
          return;
        }
      } catch {
        // DevTools not ready yet, wait and retry
      }
      await sleep();
    }
    throw new Error('Failed to connect to DevTools after timeout');
  };
  instance.target = async filterFunction => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const targets = await listTargets({port}, null);
      const target = targets.find(filterFunction);
      if (target) {
        const client = await chromeRemoteInterface({target, port});
        const {Runtime, DOM, Page} = client;
        await Runtime.enable();
        await DOM.enable();
        await Page.enable();
        return {client, Runtime, DOM, Page};
      }
      await sleep();
    }
    throw new Error('No matching target found');
  };
  return instance;
};

module.exports = {devTools};
