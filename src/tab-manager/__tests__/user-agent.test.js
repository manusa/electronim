/*
   Copyright 2019 Marc Nuri San Felix

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
describe('User Agent module test suite', () => {
  let axios;
  let userAgent;
  beforeEach(() => {
    jest.resetModules();
    jest.mock('axios');
    axios = require('axios');
    userAgent = require('../user-agent');
  });
  describe('latestChromium', () => {
    test('validResponse, should return a valid version,', async () => {
      // Given
      axios.get.mockImplementationOnce(async () => ({data: [
        {os: 'linux', versions: [{channel: 'other', version: '5uck5'}, {channel: 'stable', version: '1337'}]},
        {os: 'win'}
      ]}));
      // When
      const result = await userAgent.latestChromium();
      // Then
      expect(result).toBe('1337');
    });
    test('invalidResponse, should return null,', async () => {
      // Given
      axios.get.mockImplementationOnce(async () => ({data: [
        {os: 'win'}, 'not Valid'
      ]}));
      // When
      const result = await userAgent.latestChromium();
      // Then
      expect(result).toBeNull();
    });
  });
  test('replaceChromeVersion, should replace Chrome version in user-agent header', () => {
    // Given
    const latestChromeVersion = '1337.1337.1337';
    const dirtyUserAgent = 'Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) Chrome/79.0.1337.79 Safari/537.36';
    // When
    const result = userAgent.replaceChromeVersion(latestChromeVersion)(dirtyUserAgent);
    // Then
    expect(result).toBe('Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) Chrome/1337.1337.1337 Safari/537.36');
  });
  test('cleanUserAgent, should remove non-standard tokens from user-agent header', () => {
    // Given
    const dirtyUserAgent = 'Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) ElectronIM/13.337.0 Chrome/79.0.1337.79 Electron/0.0.99 Safari/537.36';
    // When
    const result = userAgent.sanitizeUserAgent(dirtyUserAgent);
    // Then
    expect(result).toBe('Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) Chrome/79.0.1337.79 Safari/537.36');
  });
});
