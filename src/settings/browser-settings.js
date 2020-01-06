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

const validateNewTab = ({target}) => {
  target.classList.remove('is-success', 'is-danger');
  if (validateUrl(target.value)) {
    target.classList.add('is-success');
  } else {
    target.classList.add('is-danger');
  }
};

const updateSaveButton = () => {
  const settings = document.querySelector('.settings');
  const newTabField = settings.querySelector('.settings__new-tab');
  const settingsForm = settings.querySelector('.form');
  const submit = settings.querySelector('.settings__submit');
  let enabled = true;
  if (newTabField.value.length > 0) {
    enabled = false;
  }
  if (new FormData(settingsForm).getAll('tabs').length === 0) {
    enabled = false;
  }
  if (enabled) {
    submit.removeAttribute('disabled');
  } else {
    submit.setAttribute('disabled', 'true');
  }
};

const initTabsListener = tabs => {
  const content = tabs.innerHTML;
  tabs.innerHTML = '';
  tabs.innerHTML = content;
  tabs.querySelectorAll('.icon')
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

const initNewTab = settings => {
  const newTabField = settings.querySelector('.settings__new-tab');
  const tabs = settings.querySelector('.settings__tabs');
  newTabField.addEventListener('input', event => {
    validateNewTab(event);
    updateSaveButton();
  });
  newTabField.addEventListener('keypress', event => {
    if (event.code === 'Enter') {
      event.preventDefault();
      const {target} = event;
      tabs.innerHTML += tabTemplate(prependProtocol(target.value));
      initTabsListener(tabs);
      target.value = '';
      updateSaveButton();
    }
  });
};

const initTabsSettings = settings => {
  const tabs = settings.querySelector('.settings__tabs');
  tabs.innerHTML = window.tabs.map(({url}) => url).map(tabTemplate).join('');
  initTabsListener(tabs);
};

const initSpellCheckerSettings = settings => {
  const dictionaries = settings.querySelector('.settings__dictionaries');
  const {available, enabled} = window.dictionaries;
  dictionaries.innerHTML = Object.entries(available)
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

const initButtons = settings => {
  const settingsForm = settings.querySelector('.form');
  const submit = settings.querySelector('.settings__submit');
  submit.addEventListener('click', () => {
    const formData = new FormData(settingsForm);
    ipcRenderer.send(APP_EVENTS.settingsSave, {
      tabs: formData.getAll('tabs'),
      dictionaries: formData.getAll('dictionaries')
    });
  });
  updateSaveButton();

  const cancel = settings.querySelector('.settings__cancel');
  cancel.addEventListener('click', () => ipcRenderer.send(APP_EVENTS.settingsCancel));
};

const init = () => {
  const settings = document.querySelector('.settings');
  const settingsForm = settings.querySelector('.form');
  settingsForm.addEventListener('keypress', event => (event.code === 'Enter' ? event.preventDefault() : true));
  settingsForm.addEventListener('submit', event => event.preventDefault());

  [initNewTab, initSpellCheckerSettings, initTabsSettings, initButtons].forEach(f => f.call(this, settings));
};

init();
