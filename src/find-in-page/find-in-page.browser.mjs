/*
   Copyright 2024 Marc Nuri San Felix

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
import {createRef, html, render, useLayoutEffect, useState, Icon, IconButton, TextField} from '../components/index.mjs';

const {close, findInPage, onFindInPage} = window.electron;

const getFindInPage = () => document.querySelector('.find-in-page');

const FindInPage = () => {
  const inputRef = createRef();
  const [result, setResult] = useState({});
  useLayoutEffect(() => {
    onFindInPage((_e, r) => {
      setResult(r);
      inputRef.current.focus();
    });
    inputRef.current.focus();
  }, [inputRef]);
  const noBubbling = func => e => {
    e.preventDefault();
    e.stopPropagation();
    func(e);
  };
  const onKeyDown = e => {
    switch (e.key) {
      case 'Enter':
        findInPage({text: e.target.value});
        break;
      case 'Escape':
        close();
        break;
      default:
        break;
    }
  };
  const findPrevious = () => findInPage({text: inputRef.current.value, forward: false});
  const findNext = () => findInPage({text: inputRef.current.value});
  return (html`
    <div class='dialog'>
      <div class='input-wrapper'>
        <${TextField} onKeyDown=${onKeyDown} inputProps=${{ref: inputRef}} />
        <div class='results' style=${{visibility: result.matches >= 0 ? 'visible' : 'hidden'}}>
          ${result.activeMatchOrdinal}/${result.matches}
        </div>
      </div>
      <div class='buttons'>
        <${IconButton}
            icon=${Icon.keyboardArrowUp} onClick=${noBubbling(findPrevious)} title='Previous' data-testid='find-previous' />
        <${IconButton}
            icon=${Icon.keyboardArrowDown} onClick=${noBubbling(findNext)} title='Next' data-testid='find-next' />
        <${IconButton}
            icon=${Icon.close} onClick=${noBubbling(close)} title='Close' data-testid='close' />
      </div>
    </div>
  `);
};

render(html`<${FindInPage} />`, getFindInPage());
