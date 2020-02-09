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
/* eslint-disable no-undef */
const settings = () => document.querySelector('.settings');
const settingsForm = () => settings().querySelector('.form');
const newTabField = () => settings().querySelector('.settings__new-tab .input');
const newTabAddButton = () => settings().querySelector('.settings__new-tab .button');
const tabs = () => settings().querySelector('.settings__tabs');
const dictionaries = () => settings().querySelector('.settings__dictionaries');
const submitButton = () => settings().querySelector('.settings__submit');
const cancelButton = () => settings().querySelector('.settings__cancel');

const prependProtocol = url => {
  if (url && !url.match(/^https?:\/\/.+/)) {
    return `https://${url}`;
  }
  return url;
};

const validateUrl = url => {
  url = prependProtocol(url);
  if (!url && !url.match(/^https?:\/\/.+/)) {
    return false;
  }
  try {
    return new URL(url);
  } catch (error) {
    /* error is ignored */
  }
  return false;
};

const validateNewTab = () => {
  const newTabInputElement = newTabField();
  const newTabAddButtonElement = newTabAddButton();
  newTabInputElement.classList.remove('is-success', 'is-danger');
  newTabAddButtonElement.setAttribute('disabled', 'disabled');
  if (newTabInputElement.value.length > 0 && validateUrl(newTabInputElement.value)) {
    newTabInputElement.classList.add('is-success');
    newTabAddButtonElement.removeAttribute('disabled');
  } else if (newTabInputElement.value.length > 0) {
    newTabInputElement.classList.add('is-danger');
  }
};

const updateSaveButton = () => {
  let enabled = true;
  if (newTabField().value.length > 0) {
    enabled = false;
  }
  if (new FormData(settingsForm()).getAll('tabs').length === 0) {
    enabled = false;
  }
  if (enabled) {
    submitButton().removeAttribute('disabled');
  } else {
    submitButton().setAttribute('disabled', 'true');
  }
};

const initTabsListener = () => {
  const tabsElement = tabs();
  const content = tabsElement.innerHTML;
  tabsElement.innerHTML = '';
  tabsElement.innerHTML = content;
  tabsElement.querySelectorAll('.icon')
    .forEach(icon => icon.addEventListener('click', ({target}) => {
      target.closest('.settings__tab').remove();
      updateSaveButton();
    }));
};

const tabTemplate = url => `
    <div class='field settings__tab'>
      <div class='control'>
          <input type='text' readonly class='input' name='tabs' value='${url}' />
      </div>
      <span class='icon is-medium'>
        <i class='fas fa-trash'></i>
      </span>
    </div>
  `;

const initNewTab = () => {
  newTabField().addEventListener('input', () => {
    validateNewTab();
    updateSaveButton();
  });
  const addTab = () => {
    const newTabFieldElement = newTabField();
    tabs().innerHTML += tabTemplate(prependProtocol(newTabFieldElement.value));
    initTabsListener();
    newTabFieldElement.value = '';
    validateNewTab();
    updateSaveButton();
  };
  newTabField().addEventListener('keypress', event => {
    const {target} = event;
    if (event.code === 'Enter' && validateUrl(target.value)) {
      event.preventDefault();
      addTab();
    }
  });
  newTabAddButton().addEventListener('click', addTab);
};

const initTabsSettings = () => {
  tabs().innerHTML = window.tabs.map(({url}) => url).map(tabTemplate).join('');
  initTabsListener();
};

const initSpellCheckerSettings = () => {
  const {available, enabled} = window.dictionaries;
  dictionaries().innerHTML = Object.entries(available)
    .sort(([, {name: name1}], [, {name: name2}]) => name1.localeCompare(name2))
    .map(([key, {name}]) => `
      <div class='control'>
        <label class='checkbox'>
            <input type='checkbox' name='dictionaries' value='${key}' ${enabled.includes(key) ? 'checked' : ''}>
            ${name}
        </label>
      </div>
    `).join('');
};

const initButtons = () => {
  submitButton().addEventListener('click', () => {
    const formData = new FormData(settingsForm());
    ipcRenderer.send(APP_EVENTS.settingsSave, {
      tabs: formData.getAll('tabs'),
      dictionaries: formData.getAll('dictionaries')
    });
  });
  updateSaveButton();

  cancelButton().addEventListener('click', () => ipcRenderer.send(APP_EVENTS.settingsCancel));
};

const init = () => {
  settingsForm().addEventListener('keypress', event => (event.code === 'Enter' ? event.preventDefault() : true));
  settingsForm().addEventListener('submit', event => event.preventDefault());
  [initNewTab, initSpellCheckerSettings, initTabsSettings, initButtons].forEach(f => f.call(this));
};

init();
