#!/usr/bin/env node
/* eslint-disable no-console */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const errorHandler = require('./error-handler');

const license = () => {
  const packageLicense = path.join(__dirname, '..', 'LICENSE');
  const packageLicenseTxt = path.join(__dirname, '..', 'build-config', 'LICENSE.txt');
  fs.copyFileSync(packageLicense, packageLicenseTxt);
};

const calculateHash = () => {
  const windowsPackage = path.join(__dirname, '..', 'dist', 'electronim-win-x64.zip');
  const fileBuffer = fs.readFileSync(windowsPackage);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  const hash = hashSum.digest('hex').toUpperCase();
  const chocolateyInstall = path.resolve(__dirname, '..', 'build-config', 'chocolateyInstall.ps1');
  fs.writeFileSync(chocolateyInstall, fs.readFileSync(chocolateyInstall).toString()
    .replace(/\$hash = .+$/gm, `$hash = "${hash}"`)
  );
};

const prepareChocolatey = () => {
  license();
  calculateHash();
};

process.on('unhandledRejection', errorHandler);
prepareChocolatey();
