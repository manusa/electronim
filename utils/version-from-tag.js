#!/usr/bin/env node
/* eslint-disable no-console */

const childProcess = require('child_process');
const errorHandler = require('./error-handler');
const refPrefix = 'refs/tags/v';

const extractVersionFromTag = () => {
  console.log(process.env);
  const githubRef = process.env.GITHUB_REF;
  if (githubRef && githubRef.startsWith(refPrefix)) {
    console.log(`replaced stuff ${githubRef.replace(refPrefix, '')}`);
    return githubRef.replace(refPrefix, '');
  }
  return null;
};

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
  process.exit(0);
};

process.on('unhandledRejection', errorHandler);
versionFromTag();
