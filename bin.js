#!/usr/bin/env node
/*
   Copyright 2019 Marc Nuri San Felix

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
// From .bin/electron

const electron = require('electron');

const proc = require('node:child_process');

const child = proc.spawn(electron, [__dirname], {stdio: 'inherit', windowsHide: false, cwd: __dirname});
child.on('close', code => process.exit(code));

const handleTerminationSignal = signal => process.on(signal, () => {
  if (!child.killed) {
    child.kill(signal);
  }
});

handleTerminationSignal('SIGINT');
handleTerminationSignal('SIGTERM');
