/**
 * @jest-environment node
 */
/*
   Copyright 2025 Marc Nuri San Felix

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
describe('HTTP Client module test suite', () => {
  let httpClient;

  beforeEach(() => {
    jest.resetModules();
    jest.unmock('axios');
    jest.unmock('axios-retry');
    const httpClientModule = require('../');
    httpClient = httpClientModule.httpClient;
  });

  describe('httpClient', () => {
    describe('is an axios instance', () => {
      test('httpClient is defined', () => {
        expect(httpClient).toBeDefined();
      });
      test('httpClient.get is defined', () => {
        expect(httpClient.get).toBeDefined();
      });
      test('httpClient.post is defined', () => {
        expect(httpClient.post).toBeDefined();
      });
      test('httpClient.get is a function', () => {
        expect(typeof httpClient.get).toBe('function');
      });
    });

    test('has configured timeout', () => {
      expect(httpClient.defaults.timeout).toBe(10000);
    });

    test('is a singleton', () => {
      const httpClientModule2 = require('../');
      expect(httpClient).toBe(httpClientModule2.httpClient);
    });
  });
});
