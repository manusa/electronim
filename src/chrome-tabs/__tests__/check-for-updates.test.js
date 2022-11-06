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
describe('Check For Updates module test suite', () => {
  beforeEach(() => {
    jest.resetModules();
  });
  describe('getLatestRelease', () => {
    describe('with real call', () => {
      test('retrieves the latest released version from GitHub', async () => {
        // When
        const {version} = await require('../check-for-updates').getLatestRelease();
        // Then
        expect(version).toMatch(/^\d+\.\d+\.\d+$/);
      });
    });
    describe('with mocked axios', () => {
      let axios;
      let getLatestRelease;
      beforeEach(() => {
        jest.mock('axios');
        axios = require('axios');
        getLatestRelease = require('../check-for-updates').getLatestRelease;
      });
      test('with unexpected status code throws error', async () => {
        axios.get.mockImplementationOnce(async () => ({status: 200}));
        await expect(getLatestRelease).rejects.toThrow('Unexpected response from GitHub');
      });
      test.each([
        ['v1.33.7', '1.33.7'],
        ['1.33.7', '1.33.7'],
        ['v1.33.7-rc.1', '1.33.7-rc.1'],
        ['1.33.7-beta.1', '1.33.7-beta.1']
      ])('version: transforms %s tag_name to %s', async (tag_name, expected) => {
        // Given
        axios.get.mockImplementationOnce(async () => ({
          status: 302,
          headers: {
            location: `https://github.com/manusa/electronim/releases/tag/${tag_name}`
          }
        }));
        // When
        const {version} = await getLatestRelease();
        // Then
        expect(version).toBe(expected);
      });
      test.each([
        ['v1.33.7', false],
        ['1.33.7', false],
        ['v0.0.0', true],
        ['0.0.0', true]
      ])('matchesCurrent: compares %s with 0.0.0', async (tag_name, expected) => {
        // Given
        axios.get.mockImplementationOnce(async () => ({
          status: 302,
          headers: {
            location: `https://github.com/manusa/electronim/releases/tag/${tag_name}`
          }
        }));
        // When
        const {matchesCurrent} = await getLatestRelease();
        // Then
        expect(matchesCurrent).toBe(expected);
      });
    });
  });
});
