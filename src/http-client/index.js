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
const axios = require('axios');
const axiosRetry = require('axios-retry').default;

/**
 * Shared HTTP client with retry logic for resilient HTTP requests.
 *
 * Configured with:
 * - 3 retry attempts
 * - Exponential backoff starting at 1 second
 * - 10 second timeout
 * - Retries on network errors and 5xx server errors
 */
const httpClient = axios.create({
  timeout: 10000
});

axiosRetry(httpClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay.bind(null, 1000),
  retryCondition: error => {
    // Retry on network errors or 5xx server errors
    return axiosRetry.isNetworkOrIdempotentRequestError(error)
      || (error.response && error.response.status >= 500);
  }
});

module.exports = {httpClient};
