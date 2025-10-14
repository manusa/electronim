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
const events = require('node:events');

const mockWebContentsViewInstance = () => {
  const instance = {
    listeners: {},
    on: jest.fn((eventName, func) => {
      instance.listeners[eventName] = func;
    }),
    once: jest.fn((eventName, func) => {
      instance.listeners[eventName] = func;
    }),
    setBounds: jest.fn(),
    webContents: {
      loadedUrl: '',
      copy: jest.fn(),
      copyImageAt: jest.fn(),
      cut: jest.fn(),
      destroy: jest.fn(),
      executeJavaScript: jest.fn(async () => {}),
      // https://www.electronjs.org/docs/latest/api/web-contents#contentsfindinpagetext-options
      // contents.findInPage(text[, options])
      findInPage: jest.fn(),
      focus: jest.fn(),
      getURL: jest.fn(),
      // https://nodejs.org/api/events.html#emitterlistenerseventname
      listeners: jest.fn(eventName => instance.listeners[eventName] || []),
      loadURL: jest.fn(url => {
        instance.webContents.loadedUrl = url;
      }),
      navigationHistory: {
        canGoBack: jest.fn(() => false),
        goBack: jest.fn()
      },
      on: jest.fn((...args) => instance.on(...args)),
      once: jest.fn((...args) => instance.once(...args)),
      openDevTools: jest.fn(),
      paste: jest.fn(),
      reload: jest.fn(),
      removeAllListeners: jest.fn(),
      send: jest.fn(),
      session: {},
      setWindowOpenHandler: jest.fn(),
      stopFindInPage: jest.fn(),
      userAgent: 'Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) ElectronIM/13.337.0 Chrome/WillBeReplacedByLatestChromium Electron/0.0.99 Safari/537.36'
    }
  };
  return instance;
};

const newBaseWindowInstance = () => {
  const instance = new events.EventEmitter();
  instance.bounds = {x: 0, y: 0, width: 0, height: 0};
  instance.contentBounds = {x: 0, y: 0, width: 0, height: 0};
  instance.contentView = {
    addChildView: jest.fn(view => instance.contentView.children.push(view)),
    removeChildView: jest.fn(view => {
      instance.contentView.children = instance.contentView.children.filter(child => child !== view);
    }),
    children: []
  };
  instance.destroy = jest.fn();
  instance.getBounds = jest.fn(() => instance.bounds);
  instance.getContentBounds = jest.fn(() => instance.contentBounds);
  instance.isFullScreen = jest.fn();
  instance.loadURL = jest.fn();
  instance.minimize = jest.fn();
  instance.on = jest.fn(instance.on);
  instance.removeMenu = jest.fn();
  instance.setBounds = jest.fn(bounds => {
    instance.bounds = {...instance.bounds, ...bounds};
  });
  instance.setContentBounds = jest.fn(contentBounds => {
    instance.contentBounds = {...instance.contentBounds, ...contentBounds};
  });
  instance.setFullScreen = jest.fn();
  instance.show = jest.fn();
  instance.showInactive = jest.fn();
  return instance;
};

const mockElectronInstance = ({...overriddenProps} = {}) => {
  const webContentsViewInstance = mockWebContentsViewInstance();
  const sessionInstance = {
    availableSpellCheckerLanguages: [],
    clearCache: jest.fn(),
    clearCodeCaches: jest.fn(),
    clearHostResolverCache: jest.fn(),
    clearStorageData: jest.fn(),
    setSpellCheckerEnabled: jest.fn(),
    setSpellCheckerLanguages: jest.fn(),
    userAgentInterceptor: true
  };
  // BaseWindow
  const BaseWindow = jest.fn(() => {
    const baseWindow = newBaseWindowInstance();
    BaseWindow.windows.push(baseWindow);
    return baseWindow;
  });
  BaseWindow.windows = [];
  BaseWindow.getAllWindows = jest.fn(() => BaseWindow.windows);
  // ipcMain
  const ipcMain = new events.EventEmitter();
  ipcMain.emit = jest.fn(ipcMain.emit);
  ipcMain.handle = jest.fn((channel, func) => ipcMain.on(channel, func));
  ipcMain.removeHandler = jest.fn(ipcMain.removeAllListeners);
  ipcMain.send = (channel, ...args) => ipcMain.rawListeners(channel)[0](...args);
  // Notification
  const Notification = jest.fn(() => ({
    actions: 'Actions', badge: 'Badge', body: 'Body', data: 'Data', dir: 'Dir', lang: 'Lang', tag: 'Tag', icon: 'Icon',
    image: 'Image', renotify: 'Renotify', requireInteraction: 'RequireInteraction', silent: 'Silent',
    timestamp: 'Timestamp', title: 'Title', vibrate: 'Vibrate', close: jest.fn(), show: jest.fn()
  }));
  Notification.maxActions = jest.fn(() => 1);
  Notification.permission = jest.fn(() => 'granted');
  Notification.requestPermission = jest.fn();
  const Menu = jest.fn(() => {
    const menuInstance = {
      entries: [],
      append: jest.fn(e => menuInstance.entries.push(e)),
      popup: jest.fn()
    };
    return menuInstance;
  });
  const instance = {
    WebContentsView: jest.fn(() => webContentsViewInstance),
    webContentsViewInstance,
    BaseWindow,
    Menu,
    MenuItem: jest.fn(def => def),
    Notification,
    Tray: jest.fn(() => {
      const tray = new events.EventEmitter();
      tray.destroy = jest.fn(tray.destroy);
      tray.setContextMenu = jest.fn();
      return tray;
    }),
    app: {
      commandLine: {
        appendSwitch: jest.fn()
      },
      getPath: jest.fn(),
      on: jest.fn(),
      exit: jest.fn(),
      setPath: jest.fn()
    },
    clipboard: {
      writeText: jest.fn()
    },
    contextBridge: {
      exposeInMainWorld: jest.fn((apiKey, api) => {
        globalThis[apiKey] = api;
      })
    },
    desktopCapturer: {
      getSources: jest.fn(async () => [])
    },
    dialog: {
      showSaveDialog: jest.fn(async () => ({canceled: true})),
      showOpenDialog: jest.fn(async () => ({canceled: true})),
      showMessageBox: jest.fn(async () => ({response: 1}))
    },
    globalShortcut: {
      listeners: {},
      register: jest.fn((accelerator, callback) => {
        instance.globalShortcut.listeners[accelerator] = callback;
      })
    },
    ipcMain,
    ipcRenderer: {
      on: jest.fn(),
      once: jest.fn(),
      send: jest.fn()
    },
    nativeTheme: {},
    session: {
      fromPartition: jest.fn(() => sessionInstance),
      defaultSession: sessionInstance
    },
    shell: {
      openExternal: jest.fn(async () => {}),
      openPath: jest.fn(async () => {})
    },
    ...overriddenProps
  };
  return instance;
};

const testElectron = () => {
  const mockInstance = mockElectronInstance();
  jest.mock('electron', () => mockInstance);
  return require('electron');
};

module.exports = {
  mockWebContentsViewInstance, testElectron
};
