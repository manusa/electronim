/*
   Copyright 2020 Marc Nuri San Felix

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
const refPrefix = 'refs/tags/v';

const extractVersionFromTag = () => {
  for (const githubRef of [process.env.GITHUB_REF, process.env.WORKFLOW_DISPATCH_GITHUB_REF]) {
    if (githubRef && githubRef.startsWith(refPrefix)) {
      return githubRef.replace(refPrefix, '');
    }
  }
  return null;
};

// Stamps the release of an AppStream metainfo document, which software centers show as the version
// and the date of the application. The version is only known when the tag is pushed.
const withRelease = (metainfo, version, date) => {
  const releases = `  <releases>\n    <release version="${version}" date="${date}"/>\n  </releases>\n`;
  if (metainfo.includes('<releases>')) {
    return metainfo.replace(/ *<releases>[\s\S]*?<\/releases>\n/, releases);
  }
  return metainfo.replace('</component>', `${releases}</component>`);
};

module.exports = {
  extractVersionFromTag,
  withRelease
};
