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
const webpack = require('webpack');
const path = require('path');
const fsp = require('fs/promises');
const fs = require('fs');

const {APP_EVENTS, ELECTRONIM_VERSION} = require('./src/constants');

const BUNDLES_DIR = 'bundles';
const ENTRIES = [
  'chrome-tabs',
  'help',
  'settings',
  'tab-manager'
];

const LIB_DIR = 'lib';
const LIB_ENTRIES = [
  '@fortawesome/fontawesome-free/css/all.css',
  'bulma/css/bulma.css',
  'chrome-tabs/css/chrome-tabs.css',
  'chrome-tabs/css/chrome-tabs-dark-theme.css'
];

const bundle = webpack({
  entry: ENTRIES.reduce((acc, entry) => {
    acc[entry] = `/src/${entry}/preload.js`;
    return acc;
  }, {}),
  output: {
    filename: '[name].preload.js',
    path: path.resolve(__dirname, BUNDLES_DIR),
    // Extremely important to avoid runtime require calls that fail in the Electron's sandbox environment
    chunkLoading: false
  },
  mode: 'development',
  devtool: false,
  target: 'electron-main', // Don't use 'electron-preload', Electron Sandbox takes care of proper security isolation
  optimization: {
    minimize: false,
    runtimeChunk: false
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/
      },
      {
        test: /\.(css)$/,
        use: [
          {
            loader: 'style-loader',
            options: {
              injectType: 'styleTag',
              insert: element => {
                // eslint-disable-next-line prefer-const
                let observer;
                const callback = () => {
                  if (document && document.head) {
                    document.head.append(element);
                    observer.disconnect();
                  }
                };
                observer = new MutationObserver(callback);
                observer.observe(document, {childList: true, subtree: true});
              }
            }
          },
          'css-loader'
        ]
      },
      {
        test: /\.(svg|eot|ttf|woff|woff2)$/,
        type: 'asset/inline'
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      APP_EVENTS: JSON.stringify(APP_EVENTS),
      ELECTRONIM_VERSION: JSON.stringify(ELECTRONIM_VERSION)
    })
  ]
});

const libBundle = webpack({
  entry: LIB_ENTRIES.reduce((acc, entry) => {
    acc[entry] = entry;
    return acc;
  }, {}),
  output: {
    filename: '[name].js',
    assetModuleFilename: '[name][ext]',
    path: path.resolve(__dirname, BUNDLES_DIR, LIB_DIR)
  },
  target: 'web',
  module: {
    rules: [
      {
        test: /\.(css)$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(svg|eot|ttf|woff|woff2)$/,
        type: 'asset/resource'
      }
    ]
  }
});

const toPromise = async webpackBundle => new Promise((resolve, reject) => {
  webpackBundle.run((err, stats) => {
    if (err) {
      reject(err);
    } else {
      resolve(stats);
    }
  });
});

const exec = async () => {
  console.log('⌛ Starting webpack bundling process...');
  await Promise.all(
    ENTRIES.map(entry => fsp.access(path.resolve(__dirname, 'src', entry, 'preload.js'), fs.constants.R_OK)),
    LIB_ENTRIES.map(entry => fsp.access(path.resolve(__dirname, 'node_modules', entry), fs.constants.R_OK))
  );
  console.log('✅ Required files exist');
  const bundlesDir = path.resolve(__dirname, BUNDLES_DIR);
  await Promise.all([bundlesDir].map(dir => fsp.rm(dir, {recursive: true, force: true})));
  console.log('🧹 Cleaned previous build...');
  const bundleStats = await toPromise(bundle);
  console.log(`⏱️ Webpack bundling completed in ${bundleStats.endTime - bundleStats.startTime}ms`);
  const libBundleStats = await toPromise(libBundle);
  console.log(`⏱️ Webpack lib bundling completed in ${libBundleStats.endTime - libBundleStats.startTime}ms`);
  if (bundleStats.hasErrors()) {
    console.error('⚠️ Bundling errors found:');
    bundleStats.compilation.errors.forEach(error => console.error(error));
  } else if (libBundleStats.hasErrors()) {
    console.error('⚠️ Bundling errors found for lib:');
    libBundleStats.compilation.errors.forEach(error => console.error(error));
  } else {
    console.log('🚀 Bundling completed successfully');
    console.log(bundleStats.toString({colors: true}));
  }
};

exec()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('Error while creating webpack bundles');
    console.error(err);
    process.exit(1);
  });
