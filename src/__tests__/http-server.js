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

/**
 * Creates a simple HTTP server for testing purposes
 * @param {Object} options - Server configuration options
 * @param {number} options.port - Port to listen on (default: 0 for random port)
 * @param {string} options.htmlFile - Path to HTML file to serve (default: testdata/test-page.html)
 * @returns {Promise<{server: http.Server, port: number, url: string, close: Function}>}
 */
const createTestServer = async ({port = 0, htmlFile = 'testdata/test-page.html'} = {}) => {
  const htmlPath = path.join(__dirname, htmlFile);
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  const server = http.createServer((req, res) => {
    // Log requests for debugging
    console.log(`[Test Server] ${req.method} ${req.url}`);

    // Serve the HTML file for all requests
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Length': Buffer.byteLength(htmlContent),
      'Cache-Control': 'no-cache'
    });
    res.end(htmlContent);
  });

  // Start the server
  await new Promise((resolve, reject) => {
    server.listen(port, 'localhost', err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  const actualPort = server.address().port;
  const url = `http://localhost:${actualPort}`;

  console.log(`[Test Server] Started on ${url}`);

  return {
    server,
    port: actualPort,
    url,
    close: async () => {
      return new Promise(resolve => {
        server.close(() => {
          console.log('[Test Server] Closed');
          resolve();
        });
      });
    }
  };
};

module.exports = {createTestServer};
