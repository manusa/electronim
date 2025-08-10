#!/usr/bin/env node
/*
   Copyright 2020 Marc Nuri San Felix

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
const fs = require('node:fs');
const path = require('node:path');
const errorHandler = require('./error-handler');

const electronToProdDependencies = () => {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.dependencies.electron = packageJson.devDependencies.electron;
  delete packageJson.devDependencies.electron;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
};

const prepareNpmPackage = () => {
  electronToProdDependencies();
};

process.on('unhandledRejection', errorHandler);
prepareNpmPackage();
