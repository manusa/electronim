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
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

// Store test servers in global scope to ensure cleanup
if (!globalThis.__testHttpServers__) {
  globalThis.__testHttpServers__ = [];
}

/**
 * Creates a simple HTTP server for testing purposes
 * @param {Object} options - Server configuration options
 * @param {number} options.port - Port to listen on (default: 0 for random port)
 * @param {string} options.htmlFile - Path to HTML file to serve (default: testdata/test-page.html)
 * @param {Function} options.handler - Custom request handler function(req, res)
 * @param {Object} options.routes - Map of URL paths to response configurations
 *   - routes[path].status - HTTP status code (default: 200)
 *   - routes[path].contentType - Content-Type header (default: 'application/json')
 *   - routes[path].body - Response body (string or object, objects are JSON.stringified)
 * @param {boolean} options.cors - Enable CORS headers (default: false)
 * @returns {Promise<{server: http.Server, port: number, url: string, close: Function}>}
 */
const createTestServer = async ({port = 0, htmlFile = 'testdata/test-page.html', handler, routes, cors = false} = {}) => {
  let htmlContent;
  if (htmlFile && !handler && !routes) {
    const htmlPath = path.join(__dirname, htmlFile);
    htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  }

  const server = http.createServer((req, res) => {
    // Use custom handler if provided
    if (handler) {
      handler(req, res);
      return;
    }

    const headers = {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    };

    if (cors) {
      headers['Access-Control-Allow-Origin'] = '*';
    }

    // Use routes if provided
    if (routes?.[req.url]) {
      const route = routes[req.url];
      const status = route.status || 200;
      const contentType = route.contentType || 'application/json';
      const body = typeof route.body === 'object' ? JSON.stringify(route.body) : route.body;

      headers['Content-Type'] = contentType;
      headers['Content-Length'] = Buffer.byteLength(body);
      res.writeHead(status, headers);
      res.end(body);
      return;
    }

    // Default: serve HTML file
    headers['Content-Length'] = Buffer.byteLength(htmlContent);
    res.writeHead(200, headers);
    res.end(htmlContent);
  });

  // Start the server
  await new Promise((resolve, reject) => {
    server.listen(port, 'localhost', err => {
      if (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      } else {
        resolve();
      }
    });
  });

  const actualPort = server.address().port;
  const url = `http://localhost:${actualPort}`;

  const testServer = {
    server,
    port: actualPort,
    url,
    close: async () => {
      return new Promise(resolve => {
        server.close(resolve);
        setImmediate(() => server.emit('close'));
      });
    }
  };
  globalThis.__testHttpServers__.push(testServer);
  return testServer;
};

module.exports = {createTestServer};
