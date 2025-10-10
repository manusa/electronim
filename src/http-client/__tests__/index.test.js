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
  const {createTestServer} = require('../../__tests__/http-server');
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

  describe('retry behavior', () => {
    describe('should retry', () => {
      test('on 500 Internal Server Error', async () => {
        let attempts = 0;
        const testServer = await createTestServer({
          handler: (req, res) => {
            attempts++;
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('Internal Server Error');
          }
        });

        try {
          await httpClient.get(testServer.url);
        } catch (error) {
          expect(error.response.status).toBe(500);
        }

        expect(attempts).toBeGreaterThan(1);
        await testServer.close();
      });

      test('on 502 Bad Gateway', async () => {
        let attempts = 0;
        const testServer = await createTestServer({
          handler: (req, res) => {
            attempts++;
            res.writeHead(502, {'Content-Type': 'text/plain'});
            res.end('Bad Gateway');
          }
        });

        try {
          await httpClient.get(testServer.url);
        } catch (error) {
          expect(error.response.status).toBe(502);
        }

        expect(attempts).toBeGreaterThan(1);
        await testServer.close();
      });

      test('on 503 Service Unavailable', async () => {
        let attempts = 0;
        const testServer = await createTestServer({
          handler: (req, res) => {
            attempts++;
            res.writeHead(503, {'Content-Type': 'text/plain'});
            res.end('Service Unavailable');
          }
        });

        try {
          await httpClient.get(testServer.url);
        } catch (error) {
          expect(error.response.status).toBe(503);
        }

        expect(attempts).toBeGreaterThan(1);
        await testServer.close();
      });

      test('on 504 Gateway Timeout', async () => {
        let attempts = 0;
        const testServer = await createTestServer({
          handler: (req, res) => {
            attempts++;
            res.writeHead(504, {'Content-Type': 'text/plain'});
            res.end('Gateway Timeout');
          }
        });

        try {
          await httpClient.get(testServer.url);
        } catch (error) {
          expect(error.response.status).toBe(504);
        }

        expect(attempts).toBeGreaterThan(1);
        await testServer.close();
      });

      test('eventually succeeds after retries', async () => {
        let attempts = 0;
        const testServer = await createTestServer({
          handler: (req, res) => {
            attempts++;
            if (attempts < 3) {
              res.writeHead(503, {'Content-Type': 'text/plain'});
              res.end('Service Unavailable');
            } else {
              res.writeHead(200, {'Content-Type': 'application/json'});
              res.end(JSON.stringify({success: true}));
            }
          }
        });

        const response = await httpClient.get(testServer.url);
        expect(response.status).toBe(200);
        expect(response.data).toEqual({success: true});
        expect(attempts).toBe(3);

        await testServer.close();
      });
    });

    describe('should not retry', () => {
      test('on 400 Bad Request', async () => {
        let attempts = 0;
        const testServer = await createTestServer({
          handler: (req, res) => {
            attempts++;
            res.writeHead(400, {'Content-Type': 'text/plain'});
            res.end('Bad Request');
          }
        });

        try {
          await httpClient.get(testServer.url);
        } catch (error) {
          expect(error.response.status).toBe(400);
        }

        expect(attempts).toBe(1);
        await testServer.close();
      });

      test('on 401 Unauthorized', async () => {
        let attempts = 0;
        const testServer = await createTestServer({
          handler: (req, res) => {
            attempts++;
            res.writeHead(401, {'Content-Type': 'text/plain'});
            res.end('Unauthorized');
          }
        });

        try {
          await httpClient.get(testServer.url);
        } catch (error) {
          expect(error.response.status).toBe(401);
        }

        expect(attempts).toBe(1);
        await testServer.close();
      });

      test('on 403 Forbidden', async () => {
        let attempts = 0;
        const testServer = await createTestServer({
          handler: (req, res) => {
            attempts++;
            res.writeHead(403, {'Content-Type': 'text/plain'});
            res.end('Forbidden');
          }
        });

        try {
          await httpClient.get(testServer.url);
        } catch (error) {
          expect(error.response.status).toBe(403);
        }

        expect(attempts).toBe(1);
        await testServer.close();
      });

      test('on 404 Not Found', async () => {
        let attempts = 0;
        const testServer = await createTestServer({
          handler: (req, res) => {
            attempts++;
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('Not Found');
          }
        });

        try {
          await httpClient.get(testServer.url);
        } catch (error) {
          expect(error.response.status).toBe(404);
        }

        expect(attempts).toBe(1);
        await testServer.close();
      });

      test('on 422 Unprocessable Entity', async () => {
        let attempts = 0;
        const testServer = await createTestServer({
          handler: (req, res) => {
            attempts++;
            res.writeHead(422, {'Content-Type': 'text/plain'});
            res.end('Unprocessable Entity');
          }
        });

        try {
          await httpClient.get(testServer.url);
        } catch (error) {
          expect(error.response.status).toBe(422);
        }

        expect(attempts).toBe(1);
        await testServer.close();
      });

      test('on 200 OK', async () => {
        let attempts = 0;
        const testServer = await createTestServer({
          handler: (req, res) => {
            attempts++;
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({success: true}));
          }
        });

        const response = await httpClient.get(testServer.url);
        expect(response.status).toBe(200);
        expect(attempts).toBe(1);

        await testServer.close();
      });
    });
  });
});
