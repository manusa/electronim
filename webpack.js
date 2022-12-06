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

const {APP_EVENTS, CLOSE_BUTTON_BEHAVIORS, ELECTRONIM_VERSION} = require('./src/constants');

const BUNDLES_DIR = 'bundles';

const PRELOAD_ENTRIES = [
  'about',
  'app-menu',
  'chrome-tabs',
  'help',
  'settings',
  'tab-manager'
];

const ESM_ENTRIES = {
  constants: '/esm/constants.mjs',
  preact: '/esm/preact.all.mjs'
};

const LIB_DIR = 'lib';
const LIB_ENTRIES = [
  'chrome-tabs/css/chrome-tabs.css',
  'chrome-tabs/css/chrome-tabs-dark-theme.css'
];

const preloadBundle = webpack({
  name: 'preload-bundles',
  entry: PRELOAD_ENTRIES.reduce((acc, entry) => {
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
  devtool: false, // Prevent the use `eval` --> "Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source of script in the following Content Security Policy directive: "script-src 'self'"."
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

const libBundle = ({name, entries}) => webpack({
  name,
  entry: entries.reduce((acc, entry) => {
    acc[entry] = entry;
    return acc;
  }, {}),
  output: {
    filename: '[name].js',
    assetModuleFilename: '[name][ext]',
    path: path.resolve(__dirname, BUNDLES_DIR, LIB_DIR)
  },
  mode: 'production',
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
      },
      {
        test: /\.(scss)$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      }
    ]
  }
});

const esmBundle = webpack({
  name: 'esm-bundles',
  entry: ESM_ENTRIES,
  output: {
    filename: '[name].mjs',
    path: path.resolve(__dirname, BUNDLES_DIR),
    library: {
      type: 'module'
    }
  },
  experiments: {
    outputModule: true
  },
  mode: 'development',
  devtool: false, // Prevent the use `eval` --> "Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source of script in the following Content Security Policy directive: "script-src 'self'".",
  plugins: [
    new webpack.DefinePlugin({
      APP_EVENTS_TO_BE_REPLACED: JSON.stringify(APP_EVENTS),
      CLOSE_BUTTON_BEHAVIORS_TO_BE_REPLACED: JSON.stringify(CLOSE_BUTTON_BEHAVIORS),
      ELECTRONIM_VERSION_TO_BE_REPLACED: JSON.stringify(ELECTRONIM_VERSION)
    })
  ]
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
  await Promise.all([
    ...PRELOAD_ENTRIES.map(entry => path.resolve(__dirname, 'src', entry, 'preload.js')),
    ...Object.values(ESM_ENTRIES).map(entry => path.resolve(__dirname, entry.substring(1))),
    ...LIB_ENTRIES.map(entry => path.resolve(__dirname, 'node_modules', entry))
  ].map(p => fsp.access(p, fs.constants.R_OK)));
  console.log('✅ Required files exist');
  const bundles = [preloadBundle, esmBundle];
  if (!process.argv.includes('--no-lib')) {
    const bundlesDir = path.resolve(__dirname, BUNDLES_DIR);
    await Promise.all([bundlesDir].map(dir => fsp.rm(dir, {recursive: true, force: true})));
    console.log('🧹 Cleaned previous build...');
    bundles.push(libBundle({name: 'lib', entries: LIB_ENTRIES}));
  }
  let hasErrors = false;
  for (const bundlePromise of bundles.map(toPromise)) {
    const stats = await bundlePromise;
    console.log(`⏱️ Webpack ${stats.compilation.name} bundling completed in ${stats.endTime - stats.startTime}ms`);
    if (stats.hasErrors()) {
      hasErrors = true;
      console.error(`⚠️ Bundling errors found for ${stats.compilation.name}:`);
      stats.compilation.errors.forEach(error => console.error(error));
    }
    if (!hasErrors) {
      console.log('🚀 Bundling completed successfully');
      console.log(stats.toString({colors: true}));
    }
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
