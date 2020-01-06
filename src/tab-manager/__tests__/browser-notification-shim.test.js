describe('Browser Notification Shim test suite', () => {
  test('Native Notification should be shimmed and used as delegate', () => {
    // Given
    const NativeNotification = jest.fn();
    NativeNotification.maxActions = jest.fn();
    NativeNotification.permission = jest.fn();
    NativeNotification.requestPermission = jest.fn();
    NativeNotification.prototype = {
      actions: 'Actions', badge: 'Badge', body: 'Body', data: 'Data', dir: 'Dir', lang: 'Lang', tag: 'Tag', icon: 'Icon',
      image: 'Image', renotify: 'Renotify', requireInteraction: 'RequireInteraction', silent: 'Silent',
      timestamp: 'Timestamp', title: 'Title', vibrate: 'Vibrate', close: jest.fn()
    };
    window.Notification = NativeNotification;
    require('../browser-notification-shim');
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
});
