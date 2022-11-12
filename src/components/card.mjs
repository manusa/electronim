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
import {html} from './index.mjs';

/**
 A card based on Material design (3) guidelines.
 */
export const Card = ({
  headline,
  subHeadline,
  children
}) => html`
  <div class='material3 card elevation-1 surface shape-medium body-medium'>
    <div class='card__content'>
      <div class='card__headline headline-large'>${headline}</div>
      ${subHeadline && html`<div class='card__subHeadline headline-small'>${subHeadline}</div>`}
      <div>${children}</div>
    </div>
  </div>
`;

Card.Divider = () => html`
  <div class='card__divider' />
`;
