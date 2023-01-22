#!/usr/bin/env node
/* eslint-disable no-console */

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
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
