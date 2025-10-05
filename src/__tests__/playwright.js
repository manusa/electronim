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
const spawnElectron = async ({extraArgs = [], settings} = {}) => {
  const {_electron: electron} = require('playwright');
  const path = require('node:path');
  const fs = require('node:fs');
  const os = require('node:os');
  // Add playwright global expectations
  // Extend Jest's expect with Playwright matchers
  const {expect: playwrightExpect} = require('@playwright/test');
  global.expect = Object.assign(global.expect, playwrightExpect);
  // Set environment for testing
  process.env.NODE_ENV = 'test';
  process.env.DISPLAY = process.env.DISPLAY || ':99';
  process.env.ELECTRON_IS_DEV = '0';
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

  // Set up temporary settings file if settings object is provided
  let tempDir;
  let settingsPath;
  if (settings) {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'electronim-test-'));
    settingsPath = path.join(tempDir, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    extraArgs = [...extraArgs, '--settings-path', settingsPath];
  }

  const appPath = path.join(__dirname, '..', 'index.js');
  const instance = {
    tempDir,
    app: await electron.launch({
      args: [
        appPath,
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        ...extraArgs
      ],
      env: {...process.env}
    }),
    kill: async () => {
      // Clean up temporary settings directory if it was created
      if (instance.tempDir && fs.existsSync(instance.tempDir)) {
        fs.rmSync(tempDir, {recursive: true});
      }
      if (instance.app?.process()?.pid) {
        try {
          // eslint-disable-next-line no-warning-comments
          // TODO: electronApp.close() doesn't work when tray icon is enabled, using SIGKILL directly
          // This is because the tray prevents graceful shutdown. Consider adding a test-specific
          // flag to disable tray in E2E tests for proper graceful shutdown testing.
          // await electronApp.close();
          process.kill(instance.app?.process()?.pid, 'SIGKILL');
        } catch {
          // Process already dead
        }
      }
    },
    waitForWindow: async (filterFn, timeout = 10000) => {
      const startTime = Date.now();
      while (Date.now() - startTime < timeout) {
        const windows = instance.app.windows();
        for (const window of windows) {
          const url = window.url();
          const title = await window.title();
          if (filterFn({url, title, window})) {
            return window;
          }
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      throw new Error(`Window matching filter not found within ${timeout}ms`);
    }
  };

  return instance;
};

module.exports = {spawnElectron};
