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
  newTabField.addEventListener('input', validateNewTab);
  newTabField.addEventListener('keypress', event => {
    if (event.code === 'Enter') {
      event.preventDefault();
      const {target} = event;
      tabs.innerHTML += tabTemplate(target.value);
      target.value = '';
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

const init = () => {
  const settings = document.querySelector('.settings');
  const settingsForm = settings.querySelector('.form');
  settingsForm.addEventListener('keypress', event => (event.code === 'Enter' ? event.preventDefault() : true));
  settingsForm.addEventListener('submit', event => event.preventDefault());

  [initNewTab, initSpellCheckerSettings, initTabsSettings].forEach(f => f.call(this, settings));


  const submit = settings.querySelector('.settings__submit');
  submit.addEventListener('click', () => {
    const formData = new FormData(settingsForm);
    ipcRenderer.send(APP_EVENTS.settingsSave, {
      tabs: formData.getAll('tabs'),
      dictionaries: formData.getAll('dictionaries')
    });
  });

  const cancel = settings.querySelector('.settings__cancel');
  cancel.addEventListener('click', () => ipcRenderer.send(APP_EVENTS.settingsCancel));
};

init();
