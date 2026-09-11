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
describe('E2E watchdog test suite', () => {
  let watchdog;
  let kill;
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    watchdog = require('./e2e-watchdog');
    kill = jest.spyOn(process, 'kill').mockImplementation(() => true);
  });
  afterEach(() => {
    jest.useRealTimers();
    kill.mockRestore();
  });
  describe('arguments', () => {
    // A watchdog that quietly does nothing looks exactly like no watchdog at all
    test.each([
      ['not numbers', [Number.NaN, Number.NaN]],
      ['zero', [0, 0]],
      ['negative', [-1, -2]]
    ])('should throw when the pids are %s', (_description, [runnerPid, appPid]) => {
      expect(() => watchdog.watch(runnerPid, appPid)).toThrow(TypeError);
    });
    test('should throw when the pids are missing', () => {
      expect(() => watchdog.watch()).toThrow(TypeError);
    });
    test('should not throw for two valid pids', () => {
      expect(() => watchdog.watch(1000, 1001)).not.toThrow();
    });
  });
  describe('watch', () => {
    const alive = new Set();
    beforeEach(() => {
      alive.clear();
      kill.mockImplementation((pid, signal) => {
        if (signal === 0 && !alive.has(Math.abs(pid))) {
          throw new Error('ESRCH');
        }
        return true;
      });
    });
    test('should not kill the application while the runner is alive', () => {
      // Given
      alive.add(1000).add(1001);
      watchdog.watch(1000, 1001);
      // When
      jest.advanceTimersByTime(watchdog.POLL_INTERVAL * 4);
      // Then
      expect(kill).not.toHaveBeenCalledWith(expect.anything(), 'SIGKILL');
    });
    test('should kill the application process group once the runner is gone', () => {
      // Given
      alive.add(1001);
      watchdog.watch(1000, 1001);
      // When
      jest.advanceTimersByTime(watchdog.POLL_INTERVAL);
      // Then
      expect(kill).toHaveBeenCalledWith(-1001, 'SIGKILL');
    });
    test('should stop polling once the application is gone', () => {
      // Given
      alive.add(1000);
      watchdog.watch(1000, 1001);
      jest.advanceTimersByTime(watchdog.POLL_INTERVAL);
      kill.mockClear();
      // When
      jest.advanceTimersByTime(watchdog.POLL_INTERVAL * 4);
      // Then
      expect(kill).not.toHaveBeenCalled();
    });
  });
  describe('kill', () => {
    test('should fall back to the single process where there is no group to address', () => {
      // Given
      kill.mockImplementation(pid => {
        if (pid < 0) {
          throw new Error('EPERM');
        }
        return true;
      });
      // When
      watchdog.kill(1001);
      // Then
      expect(kill).toHaveBeenCalledWith(1001, 'SIGKILL');
    });
    test('should not throw when the process is already gone', () => {
      // Given
      kill.mockImplementation(() => {
        throw new Error('ESRCH');
      });
      // Then
      expect(() => watchdog.kill(1001)).not.toThrow();
    });
  });
});
