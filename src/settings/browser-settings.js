/* eslint-disable no-undef */
const validateUrl = url => {
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


const updateSaveButton = settings => {
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
const tabTemplate = url => `
    <div class='field'>
      <div class='control'>
          <input type='text' readonly class='input' name='tabs' value='${url}' />
      </div>
    </div>
  `;

const initNewTab = settings => {
  const newTabField = settings.querySelector('.settings__new-tab');
  const tabs = settings.querySelector('.settings__tabs');
  newTabField.addEventListener('input', event => {
    validateNewTab(event);
    updateSaveButton(settings);
  });
  newTabField.addEventListener('keypress', event => {
    if (event.code === 'Enter') {
      event.preventDefault();
      const {target} = event;
      tabs.innerHTML += tabTemplate(target.value);
      target.value = '';
      updateSaveButton(settings);
    }
  });
};

const initTabsSettings = settings => {
  const tabs = settings.querySelector('.settings__tabs');
  tabs.innerHTML = window.tabs.map(({url}) => url).map(tabTemplate).join('');
};

const initSpellCheckerSettings = settings => {
  const dictionaries = settings.querySelector('.settings__dictionaries');
  const {available, enabled} = window.dictionaries;
  dictionaries.innerHTML = available.map(dict => `
      <div class='control'>
        <label class='checkbox'>
            <input type='checkbox' name='dictionaries' value='${dict}' ${enabled.includes(dict) ? 'checked' : ''}>
            ${dict}
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
  updateSaveButton(settings);

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
