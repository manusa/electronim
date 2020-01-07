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
/* eslint-disable no-global-assign,no-native-reassign */

// Delegate for Notification API as specified in: https://notifications.spec.whatwg.org/

const {ipcRenderer} = require('electron');
const {APP_EVENTS} = require('../constants');

const NativeNotification = Notification;

const bubbleNotification = () => ipcRenderer.send(APP_EVENTS.notificationClick, {tabId: window.tabId});

const setDelegateMinimumBehavior = delegate => {
  delegate.onclick = bubbleNotification;
};

// noinspection JSValidateTypes
Notification = function() {
  const delegate = new NativeNotification(...arguments);
  setDelegateMinimumBehavior(delegate);
  return {
    get actions() {
      return delegate.actions;
    },
    get badge() {
      return delegate.badge;
    },
    get body() {
      return delegate.body;
    },
    get data() {
      return delegate.data;
    },
    get dir() {
      return delegate.dir;
    },
    get lang() {
      return delegate.lang;
    },
    get tag() {
      return delegate.tag;
    },
    get icon() {
      return delegate.icon;
    },
    get image() {
      return delegate.image;
    },
    get renotify() {
      return delegate.renotify;
    },
    get requireInteraction() {
      return delegate.requireInteraction;
    },
    get silent() {
      return delegate.silent;
    },
    get timestamp() {
      return delegate.timestamp;
    },
    get title() {
      return delegate.title;
    },
    get vibrate() {
      return delegate.vibrate;
    },
    get onclick() {
      return delegate.onclick;
    },
    set onclick(func) {
      delegate.onclick = event => {
        bubbleNotification();
        func(event);
      };
    },
    get onclose() {
      return delegate.onclose;
    },
    set onclose(func) {
      delegate.onclose = func;
    },
    get onerror() {
      return delegate.onerror;
    },
    set onerror(func) {
      delegate.onerror = func;
    },
    get onshow() {
      return delegate.onshow;
    },
    set onshow(func) {
      delegate.onshow = func;
    },
    get close() {
      return delegate.close;
    }
  };
};

Notification.maxActions = NativeNotification.maxActions;
Notification.permission = NativeNotification.permission;
Notification.requestPermission = NativeNotification.requestPermission;
