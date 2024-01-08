#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const errorHandler = require('./error-handler');

const electronToDevDependencies = () => {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.devDependencies.electron = packageJson.dependencies.electron;
  delete packageJson.dependencies.electron;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
};

const prepareElectronBuilder = () => {
  electronToDevDependencies();
};

process.on('unhandledRejection', errorHandler);
prepareElectronBuilder();
