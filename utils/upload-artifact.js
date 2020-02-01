#!/usr/bin/env node
/* eslint-disable no-console,no-useless-escape */
const {extractVersionFromTag} = require('./common');
const childProcess = require('child_process');

const uploadArtifact = () => {
  if (process.argv.length < 3) {
    console.error('No artifact name specified');
    process.exit(1);
  }
  const artifactFileName = process.argv[2];
  const version = extractVersionFromTag();
  if (!version) {
    console.error('No version specified');
    process.exit(1);
  }
  const releaseId = childProcess.execSync(`curl https://api.github.com/repos/manusa/electronim/releases/tags/v${version} | jq -r ".id"`)
    .toString('utf8').replace(/\\r?\\n/g, '').trim();
  console.log(`Uploading ${artifactFileName} with version ${version} to release ${releaseId}`);
  childProcess.execSync(`curl                                                                                \\
            -H "Authorization: token $GITHUB_TOKEN"                                                                    \\
            -H "Content-Type: application/tar+gzip"                                                                    \\
            --data-binary "@dist/${artifactFileName}"                                                                  \\
            "https://uploads.github.com/repos/manusa/electronim/releases/${releaseId}/assets?name=${artifactFileName}"
            `);
};

uploadArtifact();
