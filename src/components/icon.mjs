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
 * An icon based on Material design (3) guidelines.
 *
 * @param children the icon to be rendered.
 * @param className classes to be appended to the icon class attribute.
 * @param properties any other properties to be added to the icon.
 */
export const Icon = ({
  children,
  className = '',
  ...properties
}) => html`
  <span class=${`material3 icon material-icon ${className}`} ...${properties}>${children}</span>
`;

Icon.add = '\ue145';
Icon.apps = '\ue5c3';
Icon.arrowBack = '\ue5c4';
Icon.arrowCircleUp = '\uf182';
Icon.arrowDropDown = '\ue5c5';
Icon.check = '\ue5ca';
Icon.checkBox = '\ue834';
Icon.checkBoxOutlineBlank = '\ue835';
Icon.close = '\ue5cd';
Icon.delete = '\ue872';
Icon.expandMore = '\ue5cf';
Icon.help = '\ue887';
Icon.inbox = '\ue156';
Icon.info = '\ue88e';
Icon.lock = '\ue88d';
Icon.lockOpen = '\ue898';
Icon.more = '\ue619';
Icon.moreVert = '\ue5d4';
Icon.notifications = '\ue7f4';
Icon.notificationsOff = '\ue7f6';
Icon.save = '\ue161';
Icon.settings = '\ue8b8';
Icon.spellcheck = '\ue8ce';
Icon.visibility = '\ue8f4';
Icon.visibilityOff = '\ue8f5';
