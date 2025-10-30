/**
 * @jest-environment node
 */
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
const {createTestServer} = require('../../__tests__');

describe('Update module test suite', () => {
  let electron;
  beforeEach(() => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
  });
  describe('checkForUpdatesInit', () => {
    describe('with real call', () => {
      test('retrieves the latest released version from GitHub', async () => {
        // Given
        const update = require('..');
        // When
        await update.checkForUpdatesInit();
        // Then
        expect(update.latestVersion).toMatch(/^\d+\.\d+\.\d+$/);
      });
    });
    describe('with HTTP server', () => {
      let testHandler;
      let update;
      beforeEach(async () => {
        const server = await createTestServer({
          handler: (req, res) => testHandler(req, res)
        });
        update = require('..');
        update.setUrl({
          githubReleasesLatestUrl: `${server.url}/latest`
        });
      });
      test('with unexpected status code does not throw', async () => {
        // Given
        testHandler = (req, res) => {
          res.writeHead(404, {'Content-Type': 'text/plain'});
          res.end();
        };
        // When
        await update.checkForUpdatesInit();
        // Then
        expect(update.latestVersion).toBeNull();
      });
      test.each([
        ['v1.33.7', '1.33.7'],
        ['1.33.7', '1.33.7'],
        ['v1.33.7-rc.1', '1.33.7-rc.1'],
        ['1.33.7-beta.1', '1.33.7-beta.1']
      ])('latestVersion: transforms %s tag_name to %s', async (tag_name, expected) => {
        // Given
        testHandler = (req, res) => {
          res.writeHead(302, {
            location: `https://github.com/manusa/electronim/releases/tag/${tag_name}`,
            'Content-Type': 'text/plain'
          });
          res.end();
        };
        // When
        await update.checkForUpdatesInit();
        // Then
        expect(update.latestVersion).toBe(expected);
      });
      describe('electronimNewVersionAvailable', () => {
        let eventListener;
        beforeEach(() => {
          eventListener = jest.fn();
          electron.ipcMain.on('electronimNewVersionAvailable', eventListener);
        });
        describe('emits event when new version available', () => {
          test.each([
            ['v1.33.7'],
            ['1.33.7']
          ])('for version %s', async tag_name => {
            // Given
            testHandler = (req, res) => {
              res.writeHead(302, {
                location: `https://github.com/manusa/electronim/releases/tag/${tag_name}`,
                'Content-Type': 'text/plain'
              });
              res.end();
            };
            // When
            await update.checkForUpdatesInit();
            // Then
            expect(eventListener).toHaveBeenCalledWith(true);
          });
        });
        describe('does not emit event when current version', () => {
          test.each([
            ['v0.0.0'],
            ['0.0.0']
          ])('for version %s', async tag_name => {
            // Given
            testHandler = (req, res) => {
              res.writeHead(302, {
                location: `https://github.com/manusa/electronim/releases/tag/${tag_name}`,
                'Content-Type': 'text/plain'
              });
              res.end();
            };
            // When
            await update.checkForUpdatesInit();
            // Then
            expect(eventListener).not.toHaveBeenCalled();
          });
        });
      });
      describe('polling interval', () => {
        let setIntervalSpy;
        beforeEach(() => {
          testHandler = (req, res) => {
            res.writeHead(302, {
              location: 'https://github.com/manusa/electronim/releases/tag/v1.0.0',
              'Content-Type': 'text/plain'
            });
            res.end();
          };
          setIntervalSpy = jest.spyOn(globalThis, 'setInterval');
        });
        afterEach(() => {
          setIntervalSpy.mockRestore();
        });
        test('should set up polling interval for checking updates every 30 minutes', async () => {
          // When
          await update.checkForUpdatesInit();
          // Then
          expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000 * 60 * 30);
        });
        test('should call unref on interval to prevent process hang', async () => {
          // Given
          const unref = jest.fn();
          setIntervalSpy.mockReturnValue({unref});
          // When
          await update.checkForUpdatesInit();
          // Then
          expect(unref).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});
