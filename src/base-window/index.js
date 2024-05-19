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
const {registerAppShortcuts} = require('./keyboard-shortcuts');

const findDialog = baseWindow => baseWindow.contentView.children.find(v => v.isDialog);

const showDialog = (baseWindow, dialogView) => {
  dialogView.isDialog = true;
  baseWindow.contentView.addChildView(dialogView);
  const {width, height} = baseWindow.getContentBounds();
  dialogView.setBounds({x: 0, y: 0, width, height});
  dialogView.webContents.focus();
};

module.exports = {registerAppShortcuts, findDialog, showDialog};
