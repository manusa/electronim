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
import {describe, expect, test, beforeEach, jest} from '@jest/globals';
import {screen, waitFor} from '@testing-library/dom';

describe('Task Manager in Browser test suite', () => {
  let electron;

  beforeEach(async () => {
    jest.resetModules();
    document.body.innerHTML = '<div class="task-manager-root"></div>';
    electron = {
      close: jest.fn(),
      getMetrics: jest.fn(() => [
        {
          id: 'service-1',
          name: 'WhatsApp Web',
          pid: 12345,
          memory: {workingSetSize: 104857600},
          cpu: {percentCPUUsage: 5.5}
        },
        {
          id: 'service-2',
          name: 'Telegram Web',
          pid: 12346,
          memory: {workingSetSize: 52428800},
          cpu: {percentCPUUsage: 2.3}
        }
      ]),
      killProcess: jest.fn()
    };
    globalThis.electron = electron;
    await import('../task-manager.browser.mjs');
  });

  describe('initial render', () => {
    beforeEach(async () => {
      await waitFor(() => screen.getByText('Task Manager'));
    });

    test('displays the Task Manager title', () => {
      const title = screen.getByText('Task Manager');

      expect(title).toBeTruthy();
    });

    test('displays the back button', () => {
      const backButton = document.querySelector('.leading-navigation-icon');

      expect(backButton).toBeTruthy();
    });

    test('displays table headers', () => {
      expect(screen.getByText('Task')).toBeTruthy();
      expect(screen.getByText('Memory Footprint')).toBeTruthy();
      expect(screen.getByText('CPU')).toBeTruthy();
      expect(screen.getByText('Network')).toBeTruthy();
      expect(screen.getByText('Process ID')).toBeTruthy();
    });

    test('displays End Task button', () => {
      const endTaskButton = screen.getByText('End Task');

      expect(endTaskButton).toBeTruthy();
    });
  });

  describe('metrics display', () => {
    beforeEach(async () => {
      await waitFor(() => screen.getByText('WhatsApp Web'));
    });

    test('displays service names', () => {
      expect(screen.getByText('WhatsApp Web')).toBeTruthy();
      expect(screen.getByText('Telegram Web')).toBeTruthy();
    });

    test('displays memory in MB', () => {
      expect(screen.getByText('100.0 MB')).toBeTruthy();
      expect(screen.getByText('50.0 MB')).toBeTruthy();
    });

    test('displays CPU usage', () => {
      expect(screen.getByText('5.5')).toBeTruthy();
      expect(screen.getByText('2.3')).toBeTruthy();
    });

    test('displays process IDs', () => {
      expect(screen.getByText('12345')).toBeTruthy();
      expect(screen.getByText('12346')).toBeTruthy();
    });

    test('displays network as 0', () => {
      const networkCells = document.querySelectorAll('.network-column');
      const dataNetworkCells = Array.from(networkCells).filter(
        cell => cell.tagName === 'TD'
      );

      expect(dataNetworkCells.every(cell => cell.textContent === '0')).toBe(true);
    });
  });

  describe('row selection', () => {
    beforeEach(async () => {
      await waitFor(() => screen.getByText('WhatsApp Web'));
    });

    test('End Task button is initially disabled', () => {
      const endTaskButton = screen.getByText('End Task').closest('button');

      expect(endTaskButton.disabled).toBe(true);
    });

    test('selecting a row enables End Task button', async () => {
      const firstRow = screen.getByText('WhatsApp Web').closest('tr');

      firstRow.click();
      await waitFor(() => {
        const endTaskButton = screen.getByText('End Task').closest('button');
        return !endTaskButton.disabled;
      });

      const endTaskButton = screen.getByText('End Task').closest('button');
      expect(endTaskButton.disabled).toBe(false);
    });

    test('selecting a row adds selected class', async () => {
      const firstRow = screen.getByText('WhatsApp Web').closest('tr');

      firstRow.click();
      await waitFor(() => firstRow.classList.contains('selected'));

      expect(firstRow.classList.contains('selected')).toBe(true);
    });

    test('selecting multiple rows keeps all selected', async () => {
      const firstRow = screen.getByText('WhatsApp Web').closest('tr');
      const secondRow = screen.getByText('Telegram Web').closest('tr');

      firstRow.click();
      await waitFor(() => firstRow.classList.contains('selected'));

      secondRow.click();
      await waitFor(() => secondRow.classList.contains('selected'));

      expect(firstRow.classList.contains('selected')).toBe(true);
      expect(secondRow.classList.contains('selected')).toBe(true);
    });

    test('clicking a selected row deselects it', async () => {
      const firstRow = screen.getByText('WhatsApp Web').closest('tr');

      firstRow.click();
      await waitFor(() => firstRow.classList.contains('selected'));

      firstRow.click();
      await waitFor(() => !firstRow.classList.contains('selected'));

      expect(firstRow.classList.contains('selected')).toBe(false);
    });
  });

  describe('End Task action', () => {
    beforeEach(async () => {
      await waitFor(() => screen.getByText('WhatsApp Web'));
    });

    test('clicking End Task calls killProcess', async () => {
      const firstRow = screen.getByText('WhatsApp Web').closest('tr');
      firstRow.click();

      await waitFor(() => {
        const endTaskButton = screen.getByText('End Task').closest('button');
        return !endTaskButton.disabled;
      });

      const endTaskButton = screen.getByText('End Task').closest('button');
      endTaskButton.click();

      await waitFor(() => expect(electron.killProcess).toHaveBeenCalledWith('service-1'));
    });

    test('End Task deselects the row', async () => {
      const firstRow = screen.getByText('WhatsApp Web').closest('tr');
      firstRow.click();

      await waitFor(() => {
        const endTaskButton = screen.getByText('End Task').closest('button');
        return !endTaskButton.disabled;
      });

      const endTaskButton = screen.getByText('End Task').closest('button');
      endTaskButton.click();

      await waitFor(() => {
        const button = screen.getByText('End Task').closest('button');
        return button.disabled;
      });

      expect(endTaskButton.disabled).toBe(true);
    });

    test('End Tasks button text pluralizes with multiple selections', async () => {
      const firstRow = screen.getByText('WhatsApp Web').closest('tr');
      const secondRow = screen.getByText('Telegram Web').closest('tr');

      firstRow.click();
      await waitFor(() => screen.getByText('End Task'));

      secondRow.click();
      await waitFor(() => screen.getByText('End Tasks'));

      expect(screen.getByText('End Tasks')).toBeTruthy();
    });

    test('clicking End Tasks calls killProcess for all selected', async () => {
      const firstRow = screen.getByText('WhatsApp Web').closest('tr');
      const secondRow = screen.getByText('Telegram Web').closest('tr');

      firstRow.click();
      secondRow.click();

      await waitFor(() => {
        const endTaskButton = screen.getByText('End Tasks').closest('button');
        return !endTaskButton.disabled;
      });

      const endTaskButton = screen.getByText('End Tasks').closest('button');
      endTaskButton.click();

      await waitFor(() => {
        expect(electron.killProcess).toHaveBeenCalledWith('service-1');
        expect(electron.killProcess).toHaveBeenCalledWith('service-2');
      });
    });
  });

  describe('close action', () => {
    beforeEach(async () => {
      await waitFor(() => screen.getByText('Task Manager'));
    });

    test('clicking back button calls close', async () => {
      const backButton = document.querySelector('.leading-navigation-icon');

      backButton.click();

      await waitFor(() => expect(electron.close).toHaveBeenCalledTimes(1));
    });
  });

  describe('metrics refresh', () => {
    test('calls getMetrics on initial load', async () => {
      await waitFor(() => screen.getByText('WhatsApp Web'));

      expect(electron.getMetrics).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    test('formats memory correctly when value exists', () => {
      const memoryCell = screen.getAllByText('100.0 MB')[0];

      expect(memoryCell).toBeTruthy();
    });

    test('formats CPU correctly when value exists', () => {
      const cpuCell = screen.getByText('5.5');

      expect(cpuCell).toBeTruthy();
    });
  });
});
