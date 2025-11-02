/**
 * @jest-environment node
 */
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
const {spawnElectron, createTestServer} = require('./index');

describe('E2E :: Task Manager test suite', () => {
  let electron;
  let testServer1;
  let testServer2;

  beforeAll(async () => {
    // Start HTTP servers with test pages
    testServer1 = await createTestServer({manualCleanup: true});
    testServer2 = await createTestServer({manualCleanup: true});

    // Start Electron with test settings
    electron = await spawnElectron({
      settings: {
        tabs: [
          {
            id: 'test-service-1',
            url: testServer1.url,
            customName: 'Test Service 1'
          },
          {
            id: 'test-service-2',
            url: testServer2.url,
            customName: 'Test Service 2'
          }
        ]
      }
    });
    // Wait for main window to load
    await electron.waitForWindow(
      ({url, title}) => url.includes('chrome-tabs') || title === 'ElectronIM tabs');
  });

  afterAll(async () => {
    await Promise.all([
      electron.kill(),
      testServer1.close(),
      testServer2.close()
    ]);
  });

  describe('task manager dialog', () => {
    let taskManagerWindow;

    beforeAll(async () => {
      // Trigger task manager dialog via IPC event
      await electron.app.evaluate(({ipcMain}) => {
        ipcMain.emit('taskManagerOpenDialog');
      });

      // Wait for task manager window to appear
      taskManagerWindow = await electron.waitForWindow(
        ({url}) => url.includes('task-manager/index.html'),
        5000
      );
    });

    test('task manager dialog is displayed', () => {
      expect(taskManagerWindow).toBeDefined();
    });

    test('task manager dialog has correct title', async () => {
      const title = await taskManagerWindow.title();
      expect(title).toContain('Task Manager');
    });

    test('verifies task manager root element exists', async () => {
      const taskManagerRoot = taskManagerWindow.locator('.task-manager-root');
      await expect(taskManagerRoot).toBeVisible();
    });

    test('verifies top app bar is displayed', async () => {
      const topAppBar = taskManagerWindow.locator('.top-app-bar');
      await expect(topAppBar).toBeVisible();
    });

    test('verifies top app bar has Task Manager headline', async () => {
      const headline = taskManagerWindow.locator('.top-app-bar__headline');
      await expect(headline).toContainText('Task Manager');
    });

    test('verifies task table is displayed', async () => {
      const table = taskManagerWindow.locator('.task-manager-table table');
      await expect(table).toBeVisible();
    });

    describe('table header', () => {
      test('has expected number of columns', async () => {
        const headers = taskManagerWindow.locator('.task-manager-table thead th');
        await expect(headers).toHaveCount(5);
      });

      test('has Task column header', async () => {
        const taskHeader = taskManagerWindow.locator('th.task-column');
        await expect(taskHeader).toContainText('Task');
      });

      test('has Memory Footprint column header', async () => {
        const memoryHeader = taskManagerWindow.locator('th.memory-column');
        await expect(memoryHeader).toContainText('Memory Footprint');
      });

      test('has CPU column header', async () => {
        const cpuHeader = taskManagerWindow.locator('th.cpu-column');
        await expect(cpuHeader).toContainText('CPU');
      });

      test('has Process ID column header', async () => {
        const pidHeader = taskManagerWindow.locator('th.pid-column');
        await expect(pidHeader).toContainText('Process ID');
      });
    });

    test('verifies task rows are displayed for services', async () => {
      const taskRows = taskManagerWindow.locator('.task-manager-table tbody tr');
      // We should have at least 2 tasks (one for each test service)
      const rowCount = await taskRows.count();
      expect(rowCount).toBeGreaterThanOrEqual(2);
    });

    test('verifies action buttons are displayed', async () => {
      const actionButtons = taskManagerWindow.locator('.task-manager-actions button');
      await expect(actionButtons).toHaveCount(2);
    });

    test('verifies Open DevTools button exists', async () => {
      const openDevToolsButton = taskManagerWindow.locator('.task-manager-actions button', {hasText: 'Open DevTools'});
      await expect(openDevToolsButton).toBeVisible();
    });

    test('verifies Open DevTools button is initially disabled', async () => {
      const openDevToolsButton = taskManagerWindow.locator('.task-manager-actions button', {hasText: 'Open DevTools'});
      await expect(openDevToolsButton).toBeDisabled();
    });

    test('verifies Open DevTools button has tooltip', async () => {
      const openDevToolsButton = taskManagerWindow.locator('.task-manager-actions button', {hasText: 'Open DevTools'});
      const tooltip = await openDevToolsButton.getAttribute('title');
      expect(tooltip).toBe('Open Developer Tools for selected service');
    });

    test('verifies End Task button is initially disabled', async () => {
      const endTaskButton = taskManagerWindow.locator('.task-manager-actions button', {hasText: 'End Task'});
      await expect(endTaskButton).toBeDisabled();
      await expect(endTaskButton).toContainText('End Task');
    });

    describe('task selection', () => {
      test('can select a task by clicking on row', async () => {
        const firstRow = taskManagerWindow.locator('.task-manager-table tbody tr').first();
        await firstRow.click();

        await expect(firstRow).toHaveClass(/selected/);
      });

      test('End Task button becomes enabled when task is selected', async () => {
        const endTaskButton = taskManagerWindow.locator('.task-manager-actions button', {hasText: 'End Task'});
        await expect(endTaskButton).toBeEnabled();
      });

      test('Open DevTools button becomes enabled when exactly one task is selected', async () => {
        const openDevToolsButton = taskManagerWindow.locator('.task-manager-actions button', {hasText: 'Open DevTools'});
        await expect(openDevToolsButton).toBeEnabled();
      });

      test('can select multiple tasks', async () => {
        const taskRows = taskManagerWindow.locator('.task-manager-table tbody tr');
        const rowCount = await taskRows.count();

        if (rowCount >= 2) {
          // Click on the second row
          await taskRows.nth(1).click();

          // Verify both rows are selected
          await expect(taskRows.nth(0)).toHaveClass(/selected/);
          await expect(taskRows.nth(1)).toHaveClass(/selected/);

          // Button text should change to "End Tasks" (plural)
          const endTaskButton = taskManagerWindow.locator('.task-manager-actions button', {hasText: 'End Task'});
          await expect(endTaskButton).toContainText('End Tasks');
        }
      });

      test('Open DevTools button is disabled when multiple tasks are selected', async () => {
        const taskRows = taskManagerWindow.locator('.task-manager-table tbody tr');
        const rowCount = await taskRows.count();

        if (rowCount >= 2) {
          // Verify both rows are still selected from previous test
          await expect(taskRows.nth(0)).toHaveClass(/selected/);
          await expect(taskRows.nth(1)).toHaveClass(/selected/);

          // Open DevTools button should be disabled with multiple selections
          const openDevToolsButton = taskManagerWindow.locator('.task-manager-actions button', {hasText: 'Open DevTools'});
          await expect(openDevToolsButton).toBeDisabled();
        }
      });

      test('can toggle selection by clicking checkbox', async () => {
        const firstRow = taskManagerWindow.locator('.task-manager-table tbody tr').first();
        const checkbox = firstRow.locator('.checkbox-column .checkbox');

        // Uncheck to deselect
        await checkbox.click();

        // Verify row is not selected
        await expect(firstRow).not.toHaveClass(/selected/);

        // Check again to select
        await checkbox.click();

        // Verify row is selected
        await expect(firstRow).toHaveClass(/selected/);
      });

      describe('header checkbox toggle all', () => {
        beforeEach(async () => {
          // Ensure all tasks are deselected before each test
          const taskRows = taskManagerWindow.locator('.task-manager-table tbody tr');
          const rowCount = await taskRows.count();

          for (let i = 0; i < rowCount; i++) {
            const row = taskRows.nth(i);
            const rowClass = await row.getAttribute('class');

            if (rowClass?.includes('selected')) {
              const checkbox = row.locator('.checkbox-column .checkbox');
              await checkbox.click();
              // Wait for the row to be deselected
              await expect(row).not.toHaveClass(/selected/);
            }
          }
        });

        test('can select all tasks', async () => {
          const headerCheckbox = taskManagerWindow.locator('thead .checkbox-column .checkbox');
          const taskRows = taskManagerWindow.locator('.task-manager-table tbody tr');
          const rowCount = await taskRows.count();

          // Click header checkbox to select all
          await headerCheckbox.click();

          // Verify all rows are selected
          for (let i = 0; i < rowCount; i++) {
            await expect(taskRows.nth(i)).toHaveClass(/selected/);
          }
        });

        test('can deselect all tasks', async () => {
          const headerCheckbox = taskManagerWindow.locator('thead .checkbox-column .checkbox');
          const taskRows = taskManagerWindow.locator('.task-manager-table tbody tr');
          const rowCount = await taskRows.count();

          // First, select all tasks
          await headerCheckbox.click();
          for (let i = 0; i < rowCount; i++) {
            await expect(taskRows.nth(i)).toHaveClass(/selected/);
          }

          // Click header checkbox again to deselect all
          await headerCheckbox.click();

          // Verify no rows are selected
          for (let i = 0; i < rowCount; i++) {
            await expect(taskRows.nth(i)).not.toHaveClass(/selected/);
          }
        });
      });
    });

    describe('button styling and spacing', () => {
      test('action buttons have gap between them', async () => {
        const actionsContainer = taskManagerWindow.locator('.task-manager-actions');
        const gap = await actionsContainer.evaluate(el => {
          const styles = globalThis.getComputedStyle(el);
          return styles.gap;
        });

        // Should have gap styling applied
        expect(gap).not.toBe('0px');
        expect(gap).not.toBe('normal');
      });

      test('disabled buttons have reduced opacity', async () => {
        const openDevToolsButton = taskManagerWindow.locator('.task-manager-actions button', {hasText: 'Open DevTools'});
        const opacity = await openDevToolsButton.evaluate(el => {
          const styles = globalThis.getComputedStyle(el);
          return styles.opacity;
        });

        // Disabled button should have 0.38 opacity (Material Design 3)
        expect(parseFloat(opacity)).toBe(0.38);
      });

      test('enabled button has full opacity after selection', async () => {
        const firstRow = taskManagerWindow.locator('.task-manager-table tbody tr').first();

        // Deselect all tasks first
        const taskRows = taskManagerWindow.locator('.task-manager-table tbody tr');
        const rowCount = await taskRows.count();
        for (let i = 0; i < rowCount; i++) {
          const row = taskRows.nth(i);
          const rowClass = await row.getAttribute('class');
          if (rowClass?.includes('selected')) {
            await row.click();
          }
        }

        // Select one task
        await firstRow.click();

        const openDevToolsButton = taskManagerWindow.locator('.task-manager-actions button', {hasText: 'Open DevTools'});
        const opacity = await openDevToolsButton.evaluate(el => {
          const styles = globalThis.getComputedStyle(el);
          return styles.opacity;
        });

        // Enabled button should have full opacity (1)
        expect(parseFloat(opacity)).toBe(1);
      });
    });

    describe('task data display', () => {
      test('displays task name in task column', async () => {
        const firstTaskName = taskManagerWindow.locator('.task-manager-table tbody tr').first().locator('.task-column');
        const taskNameText = await firstTaskName.textContent();

        // Task name should not be empty
        expect(taskNameText.trim().length).toBeGreaterThan(0);
      });

      test('displays memory usage in MB format', async () => {
        const firstMemory = taskManagerWindow.locator('.task-manager-table tbody tr').first().locator('.memory-column');
        const memoryText = await firstMemory.textContent();

        // Memory should be in MB format
        expect(memoryText).toMatch(/\d+(\.\d+)?\s*MB/); // NOSONAR
      });

      test('displays CPU usage', async () => {
        const firstCpu = taskManagerWindow.locator('.task-manager-table tbody tr').first().locator('.cpu-column');
        const cpuText = await firstCpu.textContent();

        // CPU should be a number
        expect(cpuText.trim()).toMatch(/\d+(\.\d+)?/);
      });

      test('displays process ID', async () => {
        const firstPid = taskManagerWindow.locator('.task-manager-table tbody tr').first().locator('.pid-column');
        const pidText = await firstPid.textContent();

        // PID should be a number
        expect(Number.parseInt(pidText.trim(), 10)).toBeGreaterThan(0);
      });
    });
  });
});
