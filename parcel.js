#!/usr/bin/env node
/*
   Copyright 2022 Marc Nuri San Felix

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
/* eslint-disable no-console */
const {Parcel} = require('@parcel/core');
const fsp = require('fs/promises');
const fs = require('fs');
const path = require('path');
const BUILD_DIR = 'build';
const BUNDLES_DIR = 'bundles';
const CACHE_DIR = '.parcel-cache';
const ENTRIES = [
  'src/chrome-tabs/preload.js',
  'src/help/preload.js',
  'src/main/preload.js',
  'src/settings/preload.js',
  'src/tab-manager/preload.js'
];

const parcel = new Parcel({
  entries: ENTRIES,
  defaultConfig: '@parcel/config-default',
  mode: 'development',
  resolvers: [],
  targets: {
    module: {
      // BROWSER ----
      // context: 'browser',
      // includeNodeModules: false,
      // outputFormat: 'global',
      // NODE ----
      context: 'electron-renderer',
      // context: 'electron-main',
      // context: 'node',
      outputFormat: 'commonjs',
      sourceMap: false,
      distDir: `${BUILD_DIR}/${BUNDLES_DIR}`,
      optimize: false,
      scopeHoist: false
    }
  }
});

const exec = async () => {
  console.warn('This bundled output of this script is not used.');
  console.warn('The script purpose is to experiment bundling preload scripts');
  console.log('Starting Parcel bundling process...');
  await Promise.all(ENTRIES.map(entry => fsp.access(path.resolve(__dirname, entry), fs.constants.R_OK)));
  const cacheDir = path.resolve(__dirname, CACHE_DIR);
  const buildDir = path.resolve(__dirname, BUILD_DIR);
  await Promise.all([cacheDir, buildDir].map(dir => fsp.rm(dir, {recursive: true, force: true})));
  console.log('Cleaned previous build...');
  const {bundleGraph, buildTime} = await parcel.run();
  console.log(`Parcel bundling completed in ${buildTime}ms`);
  console.log('Generated the following bundles:');
  bundleGraph.getBundles()
    .map(bundle => path.relative(__dirname, bundle.filePath))
    .forEach(file => console.log(` - ${file}`));
};

exec()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('Error while creating Parcel bundles');
    console.error(err);
    process.exit(1);
  });
