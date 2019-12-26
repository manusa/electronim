/* eslint-disable no-undef */
const initDictionaries = () => {
  const settings = document.querySelector('.settings');

  const settingsForm = settings.querySelector('form');
  settingsForm.addEventListener('submit', event => event.preventDefault());

  const dictionaries = settings.querySelector('.settings__dictionaries');
  const {available, enabled} = window.dictionaries;
  const innerHTML = available.map(dict => `
    <div class='control'>
      <label class='checkbox'>
          <input type='checkbox' name='dictionaries' value='${dict}' ${enabled.includes(dict) ? 'checked' : ''}>
          ${dict}
      </label>
    </div>
  `).join('');
  dictionaries.innerHTML = innerHTML;

  const submit = settings.querySelector('.settings__submit');
  submit.addEventListener('click', () => {
    const formData = new FormData(settingsForm);
    ipcRenderer.send(APP_EVENTS.settingsSave, {
      dictionaries: formData.getAll('dictionaries')
    });
  });

  const cancel = settings.querySelector('.settings__cancel');
  cancel.addEventListener('click', () => ipcRenderer.send(APP_EVENTS.settingsCancel));
};

initDictionaries();
