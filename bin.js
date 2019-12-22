#!/usr/bin/env node

// From .bin/electron

const electron = require('electron');

const proc = require('child_process');

const child = proc.spawn(electron, [__dirname], {stdio: 'inherit', windowsHide: false});
child.on('close', code => process.exit(code));

const handleTerminationSignal = signal => process.on(signal, () => {
  if (!child.killed) {
    child.kill(signal);
  }
});

handleTerminationSignal('SIGINT');
handleTerminationSignal('SIGTERM');
