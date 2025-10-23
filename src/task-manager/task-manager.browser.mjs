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
import {html, render, useState, useLayoutEffect, Button, Icon, TopAppBar} from '../components/index.mjs';

const getTaskManagerRoot = () => document.querySelector('.task-manager-root');

const formatBytes = bytes => {
  if (!bytes || bytes === 0) {
    return '0 MB';
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
};

const formatCpu = cpu => {
  if (!cpu || !cpu.percentCPUUsage) {
    return '0.0';
  }
  return cpu.percentCPUUsage.toFixed(1);
};

const TableHeader = () => html`
  <thead>
    <tr>
      <th class="task-column">Task</th>
      <th class="memory-column">Memory Footprint</th>
      <th class="cpu-column">CPU</th>
      <th class="network-column">Network</th>
      <th class="pid-column">Process ID</th>
    </tr>
  </thead>
`;

const TableRow = ({task, isSelected, onSelect}) => {
  const handleClick = () => onSelect(task.id);

  return html`
    <tr
      class=${isSelected ? 'selected' : ''}
      onClick=${handleClick}
      data-task-id=${task.id}
    >
      <td class="task-column">${task.name}</td>
      <td class="memory-column">${formatBytes(task.memory.workingSetSize)}</td>
      <td class="cpu-column">${formatCpu(task.cpu)}</td>
      <td class="network-column">0</td>
      <td class="pid-column">${task.pid}</td>
    </tr>
  `;
};

const TaskManagerContent = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const refreshMetrics = () => {
    const metrics = globalThis.electron.getMetrics();
    setTasks(metrics);
  };

  useLayoutEffect(() => {
    refreshMetrics();
    const interval = setInterval(refreshMetrics, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEndTask = () => {
    if (selectedTaskId) {
      globalThis.electron.killProcess(selectedTaskId);
      setSelectedTaskId(null);
      setTimeout(refreshMetrics, 500);
    }
  };

  return html`
    <${TopAppBar} icon=${Icon.arrowBack} iconClick=${() => globalThis.electron.close()} headline='Task Manager'/>
    <div class="task-manager-content">
      <table class="task-manager-table">
        <${TableHeader} />
        <tbody>
          ${tasks.map(task => html`
            <${TableRow}
              key=${task.id}
              task=${task}
              isSelected=${task.id === selectedTaskId}
              onSelect=${setSelectedTaskId}
            />
          `)}
        </tbody>
      </table>
      <div class="task-manager-actions">
        <${Button}
          onClick=${handleEndTask}
          disabled=${!selectedTaskId}
          type=${Button.types.outlined}
        >
          End Task
        </${Button}>
      </div>
    </div>
  `;
};

render(html`<${TaskManagerContent} />`, getTaskManagerRoot());
