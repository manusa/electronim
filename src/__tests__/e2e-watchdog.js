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
/**
 * Kills an E2E application once the test runner that started it is gone.
 *
 * Playwright starts the application in a session of its own, so a Ctrl+C on the runner never
 * reaches it. Cleanup cannot be done from the test either: jest hands tests a copy of `process`, so
 * signal and exit handlers registered there never see the real ones (the same reason Playwright's
 * own cleanup does not fire). This runs detached, outside jest, where the signals are real.
 *
 * Usage: node e2e-watchdog.js <runnerPid> <appPid>
 */
const POLL_INTERVAL = 500;

const isAlive = pid => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

/**
 * Kills an application started by the E2E helper.
 *
 * Playwright starts it detached on every platform but Windows, so on Linux and macOS it leads a
 * process group of its own and the group can be killed in one go, taking the renderer, GPU and
 * zygote processes with it. On Windows there is no group to address and this falls back to the
 * single process, which is what the helper did before.
 */
const kill = pid => {
  try {
    process.kill(-pid, 'SIGKILL');
  } catch {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // Already gone
    }
  }
};

const watch = (runnerPid, appPid) => {
  if (!Number.isInteger(runnerPid) || !Number.isInteger(appPid) || runnerPid <= 0 || appPid <= 0) {
    throw new TypeError(`e2e-watchdog needs two pids, got (${runnerPid}, ${appPid})`);
  }
  const timer = setInterval(() => {
    // The runner cleans up after itself on the way out; nothing left to guard once the
    // application is down.
    if (!isAlive(appPid)) {
      clearInterval(timer);
      return;
    }
    if (!isAlive(runnerPid)) {
      kill(appPid);
      clearInterval(timer);
    }
  }, POLL_INTERVAL);
  return timer;
};

if (require.main === module) {
  const [runnerPid, appPid] = process.argv.slice(2).map(Number);
  // Exit loudly: a watchdog that quietly does nothing is indistinguishable from no watchdog at all
  watch(runnerPid, appPid);
}

module.exports = {watch, kill, isAlive, POLL_INTERVAL};
