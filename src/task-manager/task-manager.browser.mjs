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
import {html, render, useState, useLayoutEffect, Button, Checkbox, Icon, TopAppBar} from '../components/index.mjs';

const getTaskManagerRoot = () => document.querySelector('.task-manager-root');

const formatBytes = bytes => {
  if (!bytes || bytes === 0) {
    return '0 MB';
  }
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(1)} MB`;
};

const formatCpu = cpu => {
  if (!cpu?.percentCPUUsage) {
    return '0.0';
  }
  return cpu.percentCPUUsage.toFixed(1);
};

const TableHeader = ({allSelected, onToggleAll}) => html`
  <thead>
    <tr>
      <th class="checkbox-column">
        <${Checkbox}
          checked=${allSelected}
          onClick=${onToggleAll}
        />
      </th>
      <th class="task-column">Task</th>
      <th class="memory-column">Memory Footprint</th>
      <th class="cpu-column">CPU</th>
      <th class="pid-column">Process ID</th>
    </tr>
  </thead>
`;

const TableRow = ({task, isSelected, onToggle}) => {
  const handleRowClick = () => onToggle(task.id);

  // workingSetSize is in KB
  const memoryUsageInBytes = (task.memory?.workingSetSize || 0) * 1024;
  return html`
    <tr
      class=${isSelected ? 'selected' : ''}
      onClick=${handleRowClick}
      data-task-id=${task.id}
    >
      <td class="checkbox-column">
        <${Checkbox}
          checked=${isSelected}
          onClick=${handleRowClick}
        />
      </td>
      <td class="task-column">${task.name}</td>
      <td class="memory-column">${formatBytes(memoryUsageInBytes)}</td>
      <td class="cpu-column">${formatCpu(task.cpu)}</td>
      <td class="pid-column">${task.pid}</td>
    </tr>
  `;
};

const TaskManagerContent = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);

  const refreshMetrics = () => {
    const metrics = globalThis.electron.getMetrics();
    setTasks(metrics);
  };

  useLayoutEffect(() => {
    // Calculate and set scrollbar width
    const calculateScrollbarWidth = () => {
      const outer = document.createElement('div');
      outer.style.visibility = 'hidden';
      outer.style.overflow = 'scroll';
      document.body.appendChild(outer);
      const inner = document.createElement('div');
      outer.appendChild(inner);
      const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
      outer.remove();
      document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
    };

    calculateScrollbarWidth();
    refreshMetrics();
    const interval = setInterval(refreshMetrics, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleTask = taskId => {
    setSelectedTaskIds(prevSelected => {
      if (prevSelected.includes(taskId)) {
        return prevSelected.filter(id => id !== taskId);
      }
      return [...prevSelected, taskId];
    });
  };

  const handleToggleAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map(task => task.id));
    }
  };

  const handleEndTask = () => {
    if (selectedTaskIds.length > 0) {
      for (const taskId of selectedTaskIds) {
        globalThis.electron.killProcess(taskId);
      }
      setSelectedTaskIds([]);
      setTimeout(refreshMetrics, 500);
    }
  };

  const allSelected = tasks.length > 0 && selectedTaskIds.length === tasks.length;

  return html`
    <${TopAppBar} icon=${Icon.arrowBack} iconClick=${() => globalThis.electron.close()} headline='Task Manager'/>
    <div class="task-manager-content">
      <div class="task-manager-table">
        <table>
          <${TableHeader} allSelected=${allSelected} onToggleAll=${handleToggleAll} />
          <tbody>
            ${tasks.map(task => html`
              <${TableRow}
                key=${task.id}
                task=${task}
                isSelected=${selectedTaskIds.includes(task.id)}
                onToggle=${handleToggleTask}
              />
            `)}
          </tbody>
          <tfoot />
        </table>
      </div>
      <div class="task-manager-actions">
        <${Button}
          onClick=${handleEndTask}
          disabled=${selectedTaskIds.length === 0}
          type=${Button.types.outlined}
        >
          End Task${selectedTaskIds.length > 1 ? 's' : ''}
        </${Button}>
      </div>
    </div>
  `;
};

render(html`<${TaskManagerContent} />`, getTaskManagerRoot());
