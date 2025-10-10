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

const childProcess = require('child_process');
const fs = require('node:fs');
const path = require('node:path');
const errorHandler = require('./error-handler');
const {extractVersionFromTag} = require('./common');

const versionFromTag = () => {
  const version = extractVersionFromTag();
  if (!version) {
    console.error('No version specified in $GITHUB_REF environment variable');
    process.exit(1);
  }
  console.log(`Setting project version to ${version}`);
  childProcess.execSync(` npm version --no-git-tag-version ${version}`, {
    env: {...process.env},
    stdio: 'inherit'
  });
  console.log(`Setting electronim.spec version to ${version}`);
  const electronimSpec = path.resolve(__dirname, '..', 'build-config', 'electronim.spec');
  fs.writeFileSync(electronimSpec, fs.readFileSync(electronimSpec).toString()
    .replace(/Version.+$/gm, `Version: ${version}`)
  );
  process.exit(0);
};

process.on('unhandledRejection', errorHandler);
versionFromTag();
