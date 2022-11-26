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
import {html, useState} from './index.mjs';

/**
 * A text field based on Material design (3) guidelines.
 *
 * @param type the text field type (one of outlined or filled).
 * @param label the text field label.
 * @param placeholder the text to be displayed as a hint when the text field is empty.
 * @param onInput the function to be called when the text field value changes.
 * @param onKeyDown the function to be called when a key is pressed.
 * @param value the text field value.
 * @param hasError whether the text field has an error.
 */
export const TextField = ({
  type = TextField.types.outlined,
  label,
  placeholder,
  onInput,
  onKeyDown,
  value,
  hasError = false
  /* eslint-disable-next-line no-warning-comments */
  // TODO disabled state
}) => {
  const [focused, setFocused] = useState(false);
  const onFocus = () => setFocused(true);
  const onBlur = () => setFocused(false);
  let textFieldClass = `material3 text-field ${type}`;
  if (focused) {
    textFieldClass += ' focused';
  }
  if (label) {
    textFieldClass += ' has-label';
  }
  if (value && value.length > 0) {
    textFieldClass += ' populated';
  } else {
    textFieldClass += ' empty';
  }
  if (hasError) {
    textFieldClass += ' errored';
  }
  return html`
    <div class=${textFieldClass}>
      ${label && html`<span class='text-field__label'>${label}</span>`}
      ${placeholder && html`<div class='text-field__placeholder'>${placeholder}</div>`}
      <input
        type='text'
        class='text-field__input'
        onFocus=${onFocus} onBlur=${onBlur}
        value=${value} onInput=${onInput} onKeyDown=${onKeyDown}
      />
    </div>
  `;
};

TextField.types = {
  filled: 'filled', // Not implemented yet
  outlined: 'outlined'
};
