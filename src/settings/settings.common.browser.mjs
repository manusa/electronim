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
const {html} = window;

export const prependProtocol = url => {
  if (url && !url.match(/^https?:\/\/.+/)) {
    return `https://${url}`;
  }
  return url;
};

export const validateUrl = (url, allowNoProtocol = true) => {
  if (allowNoProtocol) {
    url = prependProtocol(url);
  }
  if (!url || !url.match(/^https?:\/\/.+/)) {
    return false;
  }
  try {
    return Boolean(new URL(url));
  } catch (error) {
    /* error is ignored */
  }
  return false;
};

export const newId = () => (
  new Date().getTime().toString(36) + Math.random().toString(36).slice(2) // NOSONAR
);

export const Checkbox = ({label, title = '', icon, checked, value, onclick, ...properties}) => (html`
  <div class='control'>
    <label class='checkbox' title=${title}>
      <input type='checkbox' checked=${checked} title=${title} value=${value} onclick=${onclick} ...${properties} />
      ${icon && html`<i class='checkbox__icon fas ${icon}'></i>`} ${label}
    </label>
  </div>
`);
