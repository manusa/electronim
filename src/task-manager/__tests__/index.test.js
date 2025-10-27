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
describe('Task Manager module test suite', () => {
  let electron;
  let baseWindow;
  let serviceManagerModule;
  let taskManagerModule;

  beforeEach(async () => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    await require('../../__tests__').testSettings();
    baseWindow = new electron.BaseWindow();
    serviceManagerModule = require('../../service-manager');

    serviceManagerModule.addServices(electron.ipcRenderer)([
      {id: 1337, url: 'https://localhost'},
      {id: 313373, url: 'https://localhost?2'}
    ]);
    // eslint-disable-next-line no-warning-comments
    // TODO this won't be necessary once we fix electron.mockWebContentsViewInstance
    electron.WebContentsView.mock.results.at(0).value.webContents.getOSProcessId.mockReturnValueOnce(1000);
    electron.WebContentsView.mock.results.at(1).value.webContents.getOSProcessId.mockReturnValueOnce(2000);
    electron.app.getAppMetrics.mockReturnValue([
      {
        pid: 1000, // Use OS PIDs to match getOSProcessId()
        memory: {workingSetSize: 51200}, // 50 MB in KB
        cpu: {percentCPUUsage: 5.5}
      },
      {
        pid: 2000, // Use OS PIDs to match getOSProcessId()
        memory: {workingSetSize: 102400}, // 100 MB in KB
        cpu: {percentCPUUsage: 10.2}
      }
    ]);
    taskManagerModule = require('../');
  });

  describe('openTaskManagerDialog', () => {
    let view;

    beforeEach(() => {
      taskManagerModule.openTaskManagerDialog(baseWindow, serviceManagerModule)();
      view = electron.WebContentsView.mock.results.at(-1).value;
    });
    test('creates a WebContentsView', () => {
      expect(electron.WebContentsView).toHaveBeenCalledTimes(3); // 2 services + 1 task manager
    });
    test('loads the task manager HTML', () => {
      expect(view.webContents.loadURL).toHaveBeenCalledWith(
        expect.stringContaining('task-manager/index.html')
      );
    });
    test('has windowOpenHandler', () => {
      expect(view.webContents.setWindowOpenHandler).toHaveBeenCalledWith(expect.any(Function));
    });
    test('shows the dialog in the base window', () => {
      expect(baseWindow.contentView.addChildView).toHaveBeenCalledWith(view);
    });

    describe('webPreferences', () => {
      let webPreferences;
      beforeEach(() => {
        webPreferences = electron.WebContentsView.mock.calls.at(-1).at(0).webPreferences;
      });
      test('is sandboxed', () => {
        expect(webPreferences.sandbox).toBe(true);
      });
      test('has no node integration', () => {
        expect(webPreferences.nodeIntegration).toBe(false);
      });
      test('has context isolation', () => {
        expect(webPreferences.contextIsolation).toBe(true);
      });
    });

    describe('event listeners', () => {
      test('registers taskManagerGetMetrics listener', () => {
        expect(electron.ipcMain.rawListeners('taskManagerGetMetrics')).toHaveLength(1);
      });

      test('registers taskManagerKillProcess listener', () => {
        expect(electron.ipcMain.rawListeners('taskManagerKillProcess')).toHaveLength(1);
      });

      test('removes event listeners when webContents is destroyed', () => {
        const destroyedCallback = view.webContents.on.mock.calls.find(
          call => call[0] === 'destroyed'
        )[1];

        destroyedCallback();
        // view.webContents.send('destroyed'); // TODO: Update with mock EventEmitter when electron.js is tuned
        expect(electron.ipcMain.rawListeners('taskManagerGetMetrics')).toBeEmpty();
        expect(electron.ipcMain.rawListeners('taskManagerKillProcess')).toBeEmpty();
      });
    });
  });

  describe('getMetrics', () => {
    test('returns empty array when no services', () => {
      serviceManagerModule.removeAll();

      const result = taskManagerModule.getMetrics(serviceManagerModule)();

      expect(result).toEqual([]);
    });

    test('returns metrics for all services', () => {
      const result = taskManagerModule.getMetrics(serviceManagerModule)();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: '1337',
        name: '1337',
        pid: 1000
      });
      expect(result[1]).toMatchObject({
        id: '313373',
        name: '313373',
        pid: 2000
      });
    });

    test('includes memory metrics from app metrics', () => {
      const result = taskManagerModule.getMetrics(serviceManagerModule)();

      expect(result[0].memory).toEqual({workingSetSize: 51200});
      expect(result[1].memory).toEqual({workingSetSize: 102400});
    });

    test('includes CPU metrics from app metrics', () => {
      const result = taskManagerModule.getMetrics(serviceManagerModule)();

      expect(result[0].cpu).toEqual({percentCPUUsage: 5.5});
      expect(result[1].cpu).toEqual({percentCPUUsage: 10.2});
    });

    test('uses service ID as name when title is falsy', () => {
      serviceManagerModule.getServices = jest.fn(() => ({
        1: {
          webContents: {
            getTitle: jest.fn(() => null),
            getProcessId: jest.fn(() => 100),
            getOSProcessId: jest.fn(() => 1000)
          }
        }
      }));

      const result = taskManagerModule.getMetrics(serviceManagerModule)();

      expect(result[0].name).toBe('1');
    });

    test('returns empty memory when process metrics not found', () => {
      electron.app.getAppMetrics.mockReturnValue([]);

      const result = taskManagerModule.getMetrics(serviceManagerModule)();

      expect(result[0].memory).toEqual({});
      expect(result[0].cpu).toEqual({});
    });
  });

  describe('killProcess', () => {
    let event;
    let webContents;

    beforeEach(() => {
      process.kill = jest.fn();
      event = {};
      webContents = electron.WebContentsView.mock.results.at(0).value.webContents;
    });

    test('crashes and reloads the service renderer', () => {
      taskManagerModule.killProcess(serviceManagerModule)(event, {id: '1337'});

      expect(webContents.forcefullyCrashRenderer).toHaveBeenCalledTimes(1);
      expect(process.kill).toHaveBeenCalledWith(1000, 'SIGKILL');
      expect(webContents.reload).toHaveBeenCalledTimes(1);
    });

    test('does nothing when service not found', () => {
      expect(() => {
        taskManagerModule.killProcess(serviceManagerModule)(event, {id: 'nonexistent'});
      }).not.toThrow();
      expect(webContents.forcefullyCrashRenderer).not.toHaveBeenCalled();
      expect(process.kill).not.toHaveBeenCalled();
    });

    test('handles errors gracefully', () => {
      webContents.forcefullyCrashRenderer = jest.fn(() => {
        throw new Error('Crash failed');
      });
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      taskManagerModule.killProcess(serviceManagerModule)(event, {id: '1337'});

      expect(consoleError).toHaveBeenCalledWith('Error killing process:', expect.any(Error));
      consoleError.mockRestore();
    });
  });
});
