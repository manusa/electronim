/*
   Copyright 2026 Marc Nuri San Felix

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
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

describe('check-glibc.sh test suite', () => {
  const script = path.resolve(__dirname, '..', 'check-glibc.sh');
  let tempDir;
  let binaries;
  let result;
  // Files are native binaries when they start with the ELF magic number, the readelf stub reads the
  // symbol versions of each one from the file next to it
  const nativeBinary = (name, ...versions) => {
    fs.writeFileSync(path.join(binaries, name), Buffer.from('7f454c4602010100000000', 'hex'));
    fs.writeFileSync(path.join(binaries, `${name}.versions`), versions
      .map(version => `  0x0020:   Name: ${version}  Flags: none  Version: 2`)
      .join('\n'));
  };
  const checkGlibc = () => childProcess.spawnSync('bash', [script, binaries], {
    encoding: 'utf8',
    env: {...process.env, PATH: `${path.join(tempDir, 'bin')}${path.delimiter}${process.env.PATH}`}
  });
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'electronim-test-'));
    binaries = path.join(tempDir, 'binaries');
    fs.mkdirSync(binaries);
    fs.mkdirSync(path.join(tempDir, 'bin'));
    // Prints the symbol versions of the binary it is called with, fails when there are none, just
    // as readelf fails for a file it cannot read
    fs.writeFileSync(path.join(tempDir, 'bin', 'readelf'),
      '#!/bin/sh\nfor file; do :; done\ncat "$file.versions"\n', {mode: 0o755});
  });
  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });
  describe('with native binaries within the Ubuntu 22.04 versions', () => {
    beforeEach(() => {
      nativeBinary('electronim', 'GLIBC_2.25');
      nativeBinary('Nodehun.node', 'GLIBC_2.14', 'GLIBCXX_3.4.29');
      result = checkGlibc();
    });
    test('succeeds', () => {
      expect(result.status).toBe(0);
    });
    test('reports how many binaries it checked', () => {
      expect(result.stdout).toContain('All 2 native binaries');
    });
  });
  describe('with a native binary that needs a newer glibc', () => {
    beforeEach(() => {
      nativeBinary('electronim', 'GLIBC_2.25');
      nativeBinary('Nodehun.node', 'GLIBC_2.38', 'GLIBCXX_3.4.29');
      result = checkGlibc();
    });
    test('fails', () => {
      expect(result.status).toBe(1);
    });
    test('reports the binary that needs it', () => {
      expect(result.stderr).toContain('Nodehun.node requires GLIBC_2.38');
    });
  });
  describe('with a native binary that needs a newer libstdc++', () => {
    beforeEach(() => {
      nativeBinary('Nodehun.node', 'GLIBC_2.14', 'GLIBCXX_3.4.32');
      result = checkGlibc();
    });
    test('fails', () => {
      expect(result.status).toBe(1);
    });
  });
  describe('with a native binary whose symbol versions cannot be read', () => {
    beforeEach(() => {
      nativeBinary('Nodehun.node', 'GLIBC_2.14');
      fs.rmSync(path.join(binaries, 'Nodehun.node.versions'));
      result = checkGlibc();
    });
    test('fails', () => {
      expect(result.status).toBe(1);
    });
  });
  describe('without native binaries', () => {
    beforeEach(() => {
      fs.writeFileSync(path.join(binaries, 'README.md'), '# Not a native binary');
      result = checkGlibc();
    });
    test('fails', () => {
      expect(result.status).toBe(1);
    });
  });
  describe('without a directory', () => {
    beforeEach(() => {
      result = childProcess.spawnSync('bash', [script], {encoding: 'utf8'});
    });
    test('fails', () => {
      expect(result.status).not.toBe(0);
    });
  });
});
