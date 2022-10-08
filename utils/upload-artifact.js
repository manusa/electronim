#!/usr/bin/env node
/* eslint-disable no-console,no-useless-escape */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const errorHandler = require('./error-handler');
const {extractVersionFromTag} = require('./common');

const validateArgs = () => {
  if (process.argv.length < 4) {
    console.error('No artifact name or mime type specified');
    process.exit(1);
  }
};

const validateVersion = version => {
  if (!version) {
    console.error('No version specified');
    process.exit(1);
  }
  return version;
};

const validateFile = artifactFile => {
  if (!fs.existsSync(artifactFile)) {
    console.error(`File ${artifactFile} doesn't exist`);
    process.exit(1);
  }
  return artifactFile;
};

const getReleaseId = async version => {
  const {data: {id}} = await axios({
    method: 'GET',
    url: `https://api.github.com/repos/manusa/electronim/releases/tags/v${version}`,
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`
    }
  });
  return id;
};

const uploadArtifact = async () => {
  validateArgs();
  const version = validateVersion(extractVersionFromTag());
  const artifactFileName = process.argv[2];
  const artifactFile = validateFile(path.join('dist', artifactFileName));
  const mimeType = process.argv[3];
  const releaseId = await getReleaseId(version);
  console.log(`Uploading ${artifactFileName} with version ${version} to release ${releaseId}`);
  const artifactStream = fs.createReadStream(artifactFile);
  artifactStream.on('error', errorHandler);
  const {size: artifactSize} = fs.statSync(artifactFile);
  const {data: {id: assetId}} = await axios({
    method: 'POST',
    url: `https://uploads.github.com/repos/manusa/electronim/releases/${releaseId}/assets?name=${artifactFileName}`,
    headers: {
      Accept: 'application/vnd.github+json',
      'Content-Type': mimeType,
      'Content-Length': artifactSize,
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    data: artifactStream
  });
  if (!assetId) {
    console.error(`Error uploading artifact ${artifactFileName} to release ${releaseId}`);
    process.exit(1);
  }
  console.log(`Artifact ${artifactFileName} with version ${version} to release ${releaseId} successfully uploaded as asset ${assetId}`);
};

process.on('unhandledRejection', errorHandler);
uploadArtifact().then(() => process.exit(0)).catch(errorHandler);
