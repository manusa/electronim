#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const https = require('https');
const path = require('path');

// https://datahub.io/core/language-codes

const targetDir = path.join(__dirname, '..', 'src', 'third-party', 'hunspell-dictionaries');
const CHROMIUM_THIRD_PARTY_URL = 'https://cs.chromium.org/codesearch/f/chromium/src/third_party/hunspell_dictionaries/';

const LANGUAGES = {
  ca_ES: 'ca',
  de_DE: 'de',
  en_GB: 'en-GB',
  en_US: 'en-US',
  es_ES: 'es',
  fr_FR: 'fr',
  it_IT: 'it',
  lt_LT: 'lt',
  nl_NL: 'nl',
  pl_PL: 'pl',
  pt_PT: 'pt',
  pt_BR: 'pt-BR',
  ru_RU: 'ru',
  sv_SE: 'sv',
  tr: 'tr',
  uk_UA: 'uk'
};

const prepare = () => {
  fs.mkdirSync(targetDir, {recursive: true});
};

const downloadFromChromium = (sourceFileName, targetFileName) => {
  https.get(`${CHROMIUM_THIRD_PARTY_URL}${sourceFileName}`, response => {
    response.pipe(fs.createWriteStream(path.join(targetDir, targetFileName)));
    response.on('end', () => console.log(`Downloaded dictionary ${targetFileName} from Chromium`));
  });
};

const processChromium = () => {
  Object.entries(LANGUAGES).forEach(([key, value]) => {
    console.log(`Downloading dictionary ${value} from Chromium...`);
    downloadFromChromium(`README_${key}.txt`, `README_${value}.txt`);
    downloadFromChromium(`${key}.dic`, `${value}.dic`);
    downloadFromChromium(`${key}.aff`, `${value}.aff`);
  });
};

const download = () => {
  prepare();
  processChromium();
};

download();
