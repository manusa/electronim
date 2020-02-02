#!/usr/bin/env node
/* eslint-disable no-console,no-useless-escape */
const childProcess = require('child_process');
const path = require('path');
const errorHandler = require('./error-handler');
const {extractVersionFromTag} = require('./common');

const uploadArtifact = () => {
  if (process.argv.length < 4) {
    console.error('No artifact name or mime type specified');
    process.exit(1);
  }
  const artifactFileName = process.argv[2];
  const mimeType = process.argv[3];
  const version = extractVersionFromTag();
  if (!version) {
    console.error('No version specified');
    process.exit(1);
  }
  const releaseId = childProcess.execSync(`curl https://api.github.com/repos/manusa/electronim/releases/tags/v${version} | jq -r ".id"`,
    {stdio: 'inherit'})
    .toString('utf8').replace(/\\r?\\n/g, '').trim();
  console.log(`Uploading ${artifactFileName} with version ${version} to release ${releaseId}`);
  const assetId = childProcess.execSync(`curl                                                                 \\
            -H "Authorization: token $GITHUB_TOKEN"                                                                    \\
            -H "Content-Type: ${mimeType}"                                                                             \\
            --data-binary "@${path.join('dist', artifactFileName)}"                                                    \\
            "https://uploads.github.com/repos/manusa/electronim/releases/${releaseId}/assets?name=${artifactFileName}" \\
            | jq -r ".id"`,
  {stdio: 'inherit'})
    .toString('utf8').replace(/\\r?\\n/g, '').trim();
  if (!assetId) {
    console.error(`Error uploading artifact ${artifactFileName} to release ${releaseId}`);
    process.exit(1);
  }
  console.log(`Artifact ${artifactFileName} with version ${version} to release ${releaseId} successfully uploaded as asset ${assetId}`);
};

process.on('unhandledRejection', errorHandler);
uploadArtifact();
