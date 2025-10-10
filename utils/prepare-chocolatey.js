#!/usr/bin/env node
/*
   Copyright 2024 Marc Nuri San Felix

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
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
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
