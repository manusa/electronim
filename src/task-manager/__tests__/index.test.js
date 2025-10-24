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

  beforeEach(() => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    baseWindow = {
      contentView: {
        addChildView: jest.fn(),
        children: []
      },
      getContentBounds: jest.fn(() => ({width: 800, height: 600}))
    };
    serviceManagerModule = {
      getServices: jest.fn(() => ({
        1: {
          webContents: {
            getTitle: jest.fn(() => 'Service 1'),
            getOSProcessId: jest.fn(() => 100),
            forcefullyCrashRenderer: jest.fn(),
            reload: jest.fn()
          }
        },
        2: {
          webContents: {
            getTitle: jest.fn(() => 'Service 2'),
            getOSProcessId: jest.fn(() => 200),
            forcefullyCrashRenderer: jest.fn(),
            reload: jest.fn()
          }
        }
      })),
      getService: jest.fn(id => {
        const services = serviceManagerModule.getServices();
        return services[id];
      })
    };
    electron.app.getAppMetrics.mockReturnValue([
      {
        pid: 100,
        memory: {workingSetSize: 52428800},
        cpu: {percentCPUUsage: 5.5}
      },
      {
        pid: 200,
        memory: {workingSetSize: 104857600},
        cpu: {percentCPUUsage: 10.2}
      }
    ]);
    taskManagerModule = require('../');
  });

  describe('openTaskManagerDialog', () => {
    let openDialog;

    beforeEach(() => {
      openDialog = taskManagerModule.openTaskManagerDialog(baseWindow, serviceManagerModule);
    });

    test('creates a WebContentsView', () => {
      openDialog();

      expect(electron.WebContentsView).toHaveBeenCalledTimes(1);
    });

    test('loads the task manager HTML', () => {
      openDialog();

      const view = electron.WebContentsView.mock.results[0].value;
      expect(view.webContents.loadURL).toHaveBeenCalledWith(
        expect.stringContaining('task-manager/index.html')
      );
    });

    test('has windowOpenHandler', () => {
      openDialog();

      const view = electron.WebContentsView.mock.results[0].value;
      expect(view.webContents.setWindowOpenHandler).toHaveBeenCalledWith(expect.any(Function));
    });

    test('shows the dialog in the base window', () => {
      openDialog();

      const view = electron.WebContentsView.mock.results[0].value;
      expect(baseWindow.contentView.addChildView).toHaveBeenCalledWith(view);
    });

    describe('webPreferences', () => {
      test('is sandboxed', () => {
        openDialog();

        const webPreferences = electron.WebContentsView.mock.calls[0][0].webPreferences;
        expect(webPreferences.sandbox).toBe(true);
      });

      test('has no node integration', () => {
        openDialog();

        const webPreferences = electron.WebContentsView.mock.calls[0][0].webPreferences;
        expect(webPreferences.nodeIntegration).toBe(false);
      });

      test('has context isolation', () => {
        openDialog();

        const webPreferences = electron.WebContentsView.mock.calls[0][0].webPreferences;
        expect(webPreferences.contextIsolation).toBe(true);
      });
    });

    describe('event listeners', () => {
      test('registers taskManagerGetMetrics listener', () => {
        const onSpy = jest.spyOn(electron.ipcMain, 'on');
        openDialog();

        expect(onSpy).toHaveBeenCalledWith(
          'taskManagerGetMetrics',
          expect.any(Function)
        );
        onSpy.mockRestore();
      });

      test('registers taskManagerKillProcess listener', () => {
        const onSpy = jest.spyOn(electron.ipcMain, 'on');
        openDialog();

        expect(onSpy).toHaveBeenCalledWith(
          'taskManagerKillProcess',
          expect.any(Function)
        );
        onSpy.mockRestore();
      });

      test('removes event listeners when webContents is destroyed', () => {
        const removeListenerSpy = jest.spyOn(electron.ipcMain, 'removeListener');
        openDialog();

        const view = electron.WebContentsView.mock.results[0].value;
        const destroyedCallback = view.webContents.on.mock.calls.find(
          call => call[0] === 'destroyed'
        )[1];

        destroyedCallback();

        expect(removeListenerSpy).toHaveBeenCalledWith(
          'taskManagerGetMetrics',
          expect.any(Function)
        );
        expect(removeListenerSpy).toHaveBeenCalledWith(
          'taskManagerKillProcess',
          expect.any(Function)
        );
        removeListenerSpy.mockRestore();
      });
    });
  });

  describe('getMetrics', () => {
    test('returns empty array when no services', () => {
      serviceManagerModule.getServices.mockReturnValue({});

      const result = taskManagerModule.getMetrics(serviceManagerModule)();

      expect(result).toEqual([]);
    });

    test('returns metrics for all services', () => {
      const result = taskManagerModule.getMetrics(serviceManagerModule)();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: '1',
        name: 'Service 1',
        pid: 100
      });
      expect(result[1]).toMatchObject({
        id: '2',
        name: 'Service 2',
        pid: 200
      });
    });

    test('includes memory metrics from app metrics', () => {
      const result = taskManagerModule.getMetrics(serviceManagerModule)();

      expect(result[0].memory).toEqual({workingSetSize: 52428800});
      expect(result[1].memory).toEqual({workingSetSize: 104857600});
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
            getOSProcessId: jest.fn(() => 100)
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

    beforeEach(() => {
      event = {};
    });

    test('crashes and reloads the service renderer', () => {
      const mockService = {
        webContents: {
          forcefullyCrashRenderer: jest.fn(),
          reload: jest.fn()
        }
      };
      serviceManagerModule.getService = jest.fn(() => mockService);

      taskManagerModule.killProcess(serviceManagerModule)(event, {id: '1'});

      expect(mockService.webContents.forcefullyCrashRenderer).toHaveBeenCalledTimes(1);
      expect(mockService.webContents.reload).toHaveBeenCalledTimes(1);
    });

    test('does nothing when service not found', () => {
      serviceManagerModule.getService.mockReturnValue(null);

      expect(() => {
        taskManagerModule.killProcess(serviceManagerModule)(event, {id: 'nonexistent'});
      }).not.toThrow();
    });

    test('handles errors gracefully', () => {
      const mockService = {
        webContents: {
          forcefullyCrashRenderer: jest.fn(() => {
            throw new Error('Crash failed');
          }),
          reload: jest.fn()
        }
      };
      serviceManagerModule.getService = jest.fn(() => mockService);
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      taskManagerModule.killProcess(serviceManagerModule)(event, {id: '1'});

      expect(consoleError).toHaveBeenCalledWith('Error killing process:', expect.any(Error));
      consoleError.mockRestore();
    });
  });
});
