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
import {createRef, html, useState, Card, Icon, IconButton, TextField} from '../components/index.mjs';
import {SettingsOption, SettingsRow} from './settings.common.browser.mjs';
import {ACTIONS, addTab, isPaneActive, setTabProperty, toggleTabProperty} from './settings.reducer.browser.mjs';

const disabledIcon = disabled => (disabled === true ? Icon.visibilityOff : Icon.visibility);
const notificationIcon = disabled => (disabled === true ? Icon.notificationsOff : Icon.notifications);
const sandboxedIcon = sandboxed => (sandboxed === true ? Icon.lock : Icon.lockOpen);

const ExpandButton = ({dispatch, id, expanded = false}) => {
  const properties = {
    className: 'expand-button',
    icon: Icon.expandMore,
    title: expanded ? 'Collapse' : 'Expand (show advanced settings)',
    onClick: () => dispatch({type: ACTIONS.TOGGLE_TAB_EXPANDED, payload: id})
  };
  return html`
    <${IconButton} ...${properties} />
  `;
};

// Local images are stored inline (data: URL) in the settings file, which is read often: keep them small.
// Small files (e.g. SVG) are stored as they are, larger ones are downscaled to twice the largest icon size
// (sharp on HiDPI screens) and stored as WebP.
const CUSTOM_ICON_MAX_INLINE_SIZE = 32 * 1024;
const CUSTOM_ICON_MAX_FILE_SIZE = 5 * 1024 * 1024;
const CUSTOM_ICON_SIZE = 128;
const isDataUrl = value => value.startsWith('data:');
const isValidIcon = value => /^https?:\/\/.+/.test(value) || value.startsWith('data:image/');

const readAsDataUrl = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

const downscale = dataUrl => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => {
    // An SVG without width/height has no natural size, draw it at the icon size
    const width = image.naturalWidth || CUSTOM_ICON_SIZE;
    const height = image.naturalHeight || CUSTOM_ICON_SIZE;
    const scale = Math.min(1, CUSTOM_ICON_SIZE / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    resolve(canvas.toDataURL('image/webp', 0.9));
  };
  image.onerror = reject;
  image.src = dataUrl;
});

const CustomIcon = ({dispatch, id, customIcon}) => {
  const icon = customIcon ?? '';
  // The typed URL is only stored (and previewed) once it's complete: on blur or Enter, and only if it's valid
  const [draft, setDraft] = useState(isDataUrl(icon) ? '' : icon);
  const [error, setError] = useState('');
  const [failedPreview, setFailedPreview] = useState(null);
  const fileInput = createRef();
  const setCustomIcon = value => {
    setError('');
    setDraft(isDataUrl(value) ? '' : value);
    setTabProperty({dispatch, property: 'customIcon', value, id});
  };
  const onDraftInput = ({target: {value}}) => {
    setError('');
    setDraft(value);
  };
  const commitDraft = () => {
    const value = draft.trim();
    if (value === icon || (value === '' && isDataUrl(icon))) {
      return;
    }
    if (value === '' || isValidIcon(value)) {
      setCustomIcon(value);
    } else {
      setError('Enter an image URL starting with http(s)://');
    }
  };
  const onFileChange = async ({target}) => {
    const [file] = target.files;
    target.value = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('The selected file is not an image');
      return;
    }
    if (file.size > CUSTOM_ICON_MAX_FILE_SIZE) {
      setError(`The selected image is larger than ${CUSTOM_ICON_MAX_FILE_SIZE / 1024 / 1024} MB`);
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      setCustomIcon(file.size > CUSTOM_ICON_MAX_INLINE_SIZE ? await downscale(dataUrl) : dataUrl);
    } catch {
      setError('The selected image could not be read');
    }
  };
  let errorMessage = error;
  if (!errorMessage && icon && failedPreview === icon) {
    errorMessage = 'The image could not be loaded';
  }
  const hasError = errorMessage.length > 0;
  const message = errorMessage || (isDataUrl(icon) ? 'Using the selected local image' : '');
  return html`
    <${SettingsRow} data-testid='settings-services-custom-icon'>
      ${isValidIcon(icon) && html`
        <img class='settings__custom-icon-preview' src=${icon} alt='' onError=${() => setFailedPreview(icon)} />`}
      <${TextField}
        label='Custom icon'
        placeholder='Image URL, leave empty to use the site icon'
        hasError=${hasError}
        value=${draft}
        onInput=${onDraftInput}
        onKeyDown=${({key}) => key === 'Enter' && commitDraft()}
        onBlur=${commitDraft}
      />
      <input type='file' accept='image/*' hidden ref=${fileInput} onChange=${onFileChange}
        data-testid='settings-services-custom-icon-file' />
      <${IconButton} icon=${Icon.fileOpen} title='Select a local image' data-testid='button-custom-icon-file'
        onClick=${() => fileInput.current.click()}
      />
      <${IconButton} icon=${Icon.close} title='Remove custom icon' data-testid='button-custom-icon-clear'
        disabled=${!icon} onClick=${() => setCustomIcon('')}
      />
      ${message && html`
        <div class=${`settings__custom-icon-message${hasError ? ' settings__custom-icon-message--error' : ''}`}
          role=${hasError ? 'alert' : 'status'} data-testid='settings-services-custom-icon-message'>${message}</div>`}
    </${SettingsRow}>
  `;
};

const TabAdvancedSettings = (
  {dispatch, id, sandboxed = false, openUrlsInApp = false, customName = '', customIcon}
) => html`
  <div class='settings__tab-advanced'>
    <${SettingsRow} data-testid='settings-services-custom-tab-name'>
      <${TextField}
        label='Custom tab name'
        placeholder='Leave empty to use page title'
        value=${customName}
        onInput=${({target: {value}}) => setTabProperty({dispatch, property: 'customName', value, id})}
      />
    </${SettingsRow}>
    <${CustomIcon} dispatch=${dispatch} id=${id} customIcon=${customIcon} />
    <${SettingsOption}
      onClick=${toggleTabProperty(dispatch, 'sandboxed', id)}
      checked=${sandboxed}
      icon=${sandboxedIcon(sandboxed)}
      label='Sandbox'
      className='sandboxed-toggle'
      title='Use an isolated/sandboxed session for this tab'
    />
    <${SettingsOption}
        onClick=${toggleTabProperty(dispatch, 'openUrlsInApp', id)}
        checked=${openUrlsInApp}
        icon=${Icon.preview}
        label='Open URLs in app'
        className='open-urls-in-app-toggle'
        title='Open URLs within ElectronIM instead of opening them in the default system browser'
    />
  </div>
`;

const TabEntry = ({
  dispatch, invalidTabs, id, expanded, url, disabled, disableNotifications = false, ...tab
}) => (html`
  <${Card.Divider} />
  <div class='settings__tab ${expanded ? 'settings__tab--expanded' : ''}' data-id=${id}>
    <div class='settings__tab-main'>
      <${ExpandButton} dispatch=${dispatch} id=${id} expanded=${expanded} />
      <${TextField}
        hasError=${invalidTabs.has(id)}
        onInput=${({target: {value}}) => setTabProperty({dispatch, property: 'url', value, id})}
        value=${url}
      />
      <${IconButton} icon=${disabledIcon(disabled)} data-testid='button-disable'
        title=${disabled ? 'Tab disabled. Click to enable' : 'Tab enabled. Click to disable'}
        onClick=${toggleTabProperty(dispatch, 'disabled', id)}
      />
      <${IconButton} icon=${notificationIcon(disableNotifications)} data-testid='button-notification'
        title=${disableNotifications ? 'Notifications disabled. Click to enable' : 'Notifications enabled. Click to disable'}
        onClick=${toggleTabProperty(dispatch, 'disableNotifications', id)}
      />
      <${IconButton} icon=${Icon.delete} title='Delete tab' data-testid='button-delete'
        onClick=${() => dispatch({type: ACTIONS.REMOVE, payload: {id}})}
      /> 
    </div>
    <${TabAdvancedSettings} dispatch=${dispatch} id=${id} expanded=${expanded} disabled=${disabled}
      ...${tab}
    />
  </div>
`);

export const ServicesPane = ({dispatch, state}) => {
  const onNewTabInput = ({target: {value}}) => dispatch({
    type: ACTIONS.UPDATE_NEW_TAB_VALUE,
    payload: value
  });
  const onAddTab = addTab({dispatch});
  const onNewKeyDown = ({code}) => {
    if (code === 'Enter' || code === 'NumpadEnter') {
      onAddTab();
    }
  };
  return isPaneActive(state)(ServicesPane.id) && html`
    <h2 class='title'><${Icon}>${Icon.apps}</${Icon}>Services</h2>
    <${Card} className='settings__services'>
      <div class='settings__new-tab'>
        <${TextField}
            label='Service URL'
            placeholder='https://web.whatsapp.com' 
            value=${state.newTabValue}
            onInput=${onNewTabInput}
            onKeyDown=${onNewKeyDown}
            hasError=${state.newTabValue.length !== 0 && !state.newTabValid}
        />
        <${IconButton} icon=${Icon.add} onClick=${onAddTab} disabled=${!state.newTabValid} />
      </div>
      <div class='settings__tabs'>
        ${state.tabs.map(tab => (html`
          <${TabEntry}
            dispatch=${dispatch} expanded=${state.expandedTabs.includes(tab.id)} invalidTabs=${state.invalidTabs}
            ...${tab}
          />
      `))}
      </div>
    </${Card}>
  `;
};

ServicesPane.id = 'services';
