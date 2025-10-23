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
describe('Task Manager Module preload test suite', () => {
  let electron;
  beforeEach(() => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    globalThis.APP_EVENTS = require('../../constants').APP_EVENTS;
  });
  describe('preload (just for coverage and sanity, see bundle tests)', () => {
    beforeEach(() => {
      require('../preload');
    });
    describe('creates an API', () => {
      test('with entries', () => {
        expect(electron.contextBridge.exposeInMainWorld).toHaveBeenCalledWith('electron', {
          close: expect.toBeFunction(),
          getMetrics: expect.toBeFunction(),
          killProcess: expect.toBeFunction()
        });
      });
    });
    describe('API', () => {
      let api;
      beforeEach(() => {
        api = electron.contextBridge.exposeInMainWorld.mock.calls[0][1];
      });
      test('close sends closeDialog event', () => {
        api.close();
        expect(electron.ipcRenderer.sendSync).toHaveBeenCalledWith('closeDialog');
      });
      test('getMetrics sends taskManagerGetMetrics event', () => {
        electron.ipcRenderer.sendSync.mockReturnValue([
          {id: '1', name: 'Service 1', pid: 100, memory: {}, cpu: {}}
        ]);
        const result = api.getMetrics();
        expect(electron.ipcRenderer.sendSync).toHaveBeenCalledWith('taskManagerGetMetrics');
        expect(result).toHaveLength(1);
      });
      test('killProcess sends taskManagerKillProcess event', () => {
        api.killProcess('test-id');
        expect(electron.ipcRenderer.send).toHaveBeenCalledWith(
          'taskManagerKillProcess',
          {id: 'test-id'}
        );
      });
    });
  });
  describe('preload.bundle', () => {
    beforeEach(() => {
      require('../../../bundles/task-manager.preload');
    });
    test('creates an API', () => {
      expect(electron.contextBridge.exposeInMainWorld).toHaveBeenCalledWith('electron', {
        close: expect.toBeFunction(),
        getMetrics: expect.toBeFunction(),
        killProcess: expect.toBeFunction()
      });
    });
  });
});
