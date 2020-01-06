/* eslint-disable no-global-assign,no-native-reassign */
const {ipcRenderer} = require('electron');
const {APP_EVENTS} = require('../constants');

const NativeNotification = Notification;

// noinspection JSValidateTypes
Notification = function() {
  const delegate = new NativeNotification(...arguments);
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
        ipcRenderer.send(APP_EVENTS.notificationClick, {tabId: window.tabId});
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
      return delegate.close();
    }
  };
};

Notification.permission = NativeNotification.permission;
Notification.requestPermission = NativeNotification.requestPermission;
