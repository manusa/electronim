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
  // sections of each one from the file next to it. A library defines the versions other binaries can
  // link against, and needs the versions it links against itself, readelf prints both.
  const nativeBinary = (name, {needs = [], defines = []} = {}) => {
    fs.writeFileSync(path.join(binaries, name), Buffer.from('7f454c4602010100000000', 'hex'));
    fs.writeFileSync(path.join(binaries, `${name}.versions`), [
      `Version definition section '.gnu.version_d' contains ${defines.length} entries:`,
      ...defines.map(version => `  0x0028: Rev: 1  Flags: none  Index: 2  Cnt: 1  Name: ${version}`),
      `Version needs section '.gnu.version_r' contains ${needs.length} entries:`,
      ...needs.map(version => `  0x0010:   Name: ${version}  Flags: none  Version: 2`)
    ].join('\n'));
  };
  const checkGlibc = (...paths) => childProcess.spawnSync('bash', [script, ...paths], {
    encoding: 'utf8',
    env: {...process.env, PATH: `${path.join(tempDir, 'bin')}${path.delimiter}${process.env.PATH}`}
  });
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'electronim-test-'));
    binaries = path.join(tempDir, 'binaries');
    fs.mkdirSync(binaries);
    fs.mkdirSync(path.join(tempDir, 'bin'));
    // Prints the sections of the binary it is called with, fails when there are none, just as readelf
    // fails for a file it cannot read
    fs.writeFileSync(path.join(tempDir, 'bin', 'readelf'),
      '#!/bin/sh\nfor file; do :; done\ncat "$file.versions"\n', {mode: 0o755});
  });
  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });
  describe('with native binaries that need the versions Ubuntu 22.04 provides', () => {
    beforeEach(() => {
      nativeBinary('electronim', {needs: ['GLIBC_2.2.5', 'GLIBC_2.25', 'GLIBC_2.17']});
      nativeBinary('Nodehun.node', {
        needs: ['GLIBC_2.14', 'GLIBC_2.35', 'GLIBCXX_3.4.30', 'CXXABI_1.3.13', 'GCC_12.0.0']
      });
      result = checkGlibc(binaries);
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
      nativeBinary('electronim', {needs: ['GLIBC_2.25']});
      nativeBinary('Nodehun.node', {needs: ['GLIBC_2.14', 'GLIBC_2.36', 'GLIBCXX_3.4.29']});
      result = checkGlibc(binaries);
    });
    test('fails', () => {
      expect(result.status).toBe(1);
    });
    test('reports the binary that needs it', () => {
      expect(result.stderr).toContain('Nodehun.node needs GLIBC_2.36');
    });
  });
  describe('with a native binary that needs a newer libstdc++', () => {
    beforeEach(() => {
      nativeBinary('Nodehun.node', {needs: ['GLIBC_2.14', 'GLIBCXX_3.4.29', 'GLIBCXX_3.4.31']});
      result = checkGlibc(binaries);
    });
    test('fails', () => {
      expect(result.status).toBe(1);
    });
  });
  describe('with a native binary that needs a newer C++ ABI', () => {
    beforeEach(() => {
      nativeBinary('Nodehun.node', {needs: ['CXXABI_1.3.15']});
      result = checkGlibc(binaries);
    });
    test('fails', () => {
      expect(result.status).toBe(1);
    });
  });
  describe('with a native binary that needs a newer libgcc', () => {
    beforeEach(() => {
      nativeBinary('Nodehun.node', {needs: ['GCC_14.0.0']});
      result = checkGlibc(binaries);
    });
    test('fails', () => {
      expect(result.status).toBe(1);
    });
  });
  describe('with a native binary linked with relative relocations', () => {
    beforeEach(() => {
      // Ubuntu 24.04 links with -Wl,-z,pack-relative-relocs by default, which needs a glibc ABI
      // version that Ubuntu 22.04 doesn't have at all
      nativeBinary('electronim', {needs: ['GLIBC_2.34', 'GLIBC_ABI_DT_RELR']});
      result = checkGlibc(binaries);
    });
    test('fails', () => {
      expect(result.status).toBe(1);
    });
    test('reports the version it needs', () => {
      expect(result.stderr).toContain('GLIBC_ABI_DT_RELR');
    });
  });
  describe('with a bundled library that defines newer versions than it needs', () => {
    beforeEach(() => {
      // Bundling a newer libstdc++ is how this class of problem gets fixed, the versions a library
      // defines say nothing about what it needs to load
      nativeBinary('libstdc++.so.6', {
        defines: ['GLIBCXX_3.4.30', 'GLIBCXX_3.4.33', 'CXXABI_1.3.15'],
        needs: ['GLIBC_2.17', 'GCC_4.2.0']
      });
      result = checkGlibc(binaries);
    });
    test('succeeds', () => {
      expect(result.status).toBe(0);
    });
  });
  describe('with several paths', () => {
    let other;
    beforeEach(() => {
      other = path.join(tempDir, 'other');
      fs.mkdirSync(other);
      nativeBinary('electronim', {needs: ['GLIBC_2.25']});
      fs.writeFileSync(path.join(other, 'runtime'), Buffer.from('7f454c4602010100000000', 'hex'));
      fs.writeFileSync(path.join(other, 'runtime.versions'),
        'Version needs section \'.gnu.version_r\' contains 1 entries:\n  0x0010:   Name: GLIBC_2.38  Flags: none  Version: 2');
      result = checkGlibc(binaries, other);
    });
    test('fails for a binary outside the first path', () => {
      expect(result.status).toBe(1);
    });
    test('counts the binaries of every path', () => {
      expect(result.stderr).toContain('1 of 2 native binaries');
    });
  });
  describe('with a native binary whose symbol versions cannot be read', () => {
    beforeEach(() => {
      nativeBinary('Nodehun.node', {needs: ['GLIBC_2.14']});
      fs.rmSync(path.join(binaries, 'Nodehun.node.versions'));
      result = checkGlibc(binaries);
    });
    test('fails', () => {
      expect(result.status).toBe(1);
    });
  });
  describe('without native binaries', () => {
    beforeEach(() => {
      fs.writeFileSync(path.join(binaries, 'README.md'), '# Not a native binary');
      result = checkGlibc(binaries);
    });
    test('fails', () => {
      expect(result.status).toBe(1);
    });
  });
  describe('with a path that cannot be listed', () => {
    beforeEach(() => {
      result = checkGlibc(path.join(tempDir, 'does-not-exist'));
    });
    test('fails', () => {
      expect(result.status).not.toBe(0);
    });
  });
  describe('without a path', () => {
    beforeEach(() => {
      result = childProcess.spawnSync('bash', [script], {encoding: 'utf8'});
    });
    test('fails', () => {
      expect(result.status).not.toBe(0);
    });
  });
});
