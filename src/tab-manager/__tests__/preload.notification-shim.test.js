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
describe('Browser Notification Shim test suite', () => {
  let NativeNotification;
  let electron;
  beforeEach(() => {
    jest.resetModules();
    jest.mock('electron', () => ({
      ipcRenderer: {
        send: jest.fn(),
        sendSync: jest.fn(() => true)
      }
    }));
    electron = require('electron');
    window.APP_EVENTS = require('../../constants').APP_EVENTS;
    NativeNotification = jest.fn();
    NativeNotification.maxActions = jest.fn();
    NativeNotification.permission = jest.fn();
    NativeNotification.requestPermission = jest.fn();
    NativeNotification.prototype = {
      actions: 'Actions', badge: 'Badge', body: 'Body', data: 'Data', dir: 'Dir', lang: 'Lang', tag: 'Tag', icon: 'Icon',
      image: 'Image', renotify: 'Renotify', requireInteraction: 'RequireInteraction', silent: 'Silent',
      timestamp: 'Timestamp', title: 'Title', vibrate: 'Vibrate', close: jest.fn()
    };
    window.Notification = NativeNotification;
  });
  describe('Notifications are enabled for the current tab', () => {
    test('Native Notification should be shimmed and used as delegate', () => {
      // Given
      require('../preload.notification-shim');
      // When
      const notification = new Notification();
      Notification.maxActions();
      Notification.permission();
      Notification.requestPermission();
      // Then
      expect(window.Notification).not.toBe(NativeNotification);
      expect(NativeNotification).toHaveBeenCalledTimes(1);
      expect(NativeNotification.maxActions).toHaveBeenCalledTimes(1);
      expect(NativeNotification.permission).toHaveBeenCalledTimes(1);
      expect(NativeNotification.requestPermission).toHaveBeenCalledTimes(1);
      expect(notification.actions).toBe('Actions');
      expect(notification.badge).toBe('Badge');
      expect(notification.body).toBe('Body');
      expect(notification.data).toBe('Data');
      expect(notification.dir).toBe('Dir');
      expect(notification.lang).toBe('Lang');
      expect(notification.tag).toBe('Tag');
      expect(notification.icon).toBe('Icon');
      expect(notification.image).toBe('Image');
      expect(notification.renotify).toBe('Renotify');
      expect(notification.requireInteraction).toBe('RequireInteraction');
      expect(notification.silent).toBe('Silent');
      expect(notification.timestamp).toBe('Timestamp');
      expect(notification.title).toBe('Title');
      expect(notification.vibrate).toBe('Vibrate');
      notification.close();
      expect(NativeNotification.prototype.close).toHaveBeenCalledTimes(1);
    });
    test('Notification should ALWAYS be clickable', () => {
      // Given
      require('../preload.notification-shim');
      const notification = new Notification();
      // When
      notification.onclick(null);
      // Then
      expect(electron.ipcRenderer.send).toHaveBeenCalledTimes(1);
      expect(electron.ipcRenderer.send).toHaveBeenCalledWith('notificationClick', expect.any(Object));
    });
    test('Notification onclick setter, should add custom behavior', () => {
      // Given
      require('../preload.notification-shim');
      const notification = new Notification();
      const webAppOnclick = jest.fn();
      notification.onclick = webAppOnclick;
      // When
      notification.onclick(null);
      // Then
      expect(webAppOnclick).toHaveBeenCalledTimes(1);
      expect(electron.ipcRenderer.send).toHaveBeenCalledTimes(1);
    });
  });
  describe('Notifications for this particular tab are disabled', () => {
    test('notification should not delegate, and should return empty object', () => {
      // Given
      electron.ipcRenderer.sendSync = jest.fn(() => false);
      require('../preload.notification-shim');
      // When
      const notification = new Notification();
      // Then
      expect(notification).toEqual({});
      expect(NativeNotification).not.toHaveBeenCalled();
    });
  });
});
