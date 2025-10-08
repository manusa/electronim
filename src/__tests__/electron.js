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

const mockWebContentsViewInstance = () => {
  const instance = {
    listeners: {},
    on: jest.fn((eventName, func) => {
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
        goBack: jest.fn()
      },
      on: jest.fn((...args) => instance.on(...args)),
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

const mockBaseWindowInstance = () => {
  const instance = {
    listeners: {},
    bounds: {x: 0, y: 0, width: 0, height: 0},
    contentBounds: {x: 0, y: 0, width: 0, height: 0},
    destroy: jest.fn(),
    isFullScreen: jest.fn(),
    loadURL: jest.fn(),
    minimize: jest.fn(),
    on: jest.fn((eventName, func) => {
      instance.listeners[eventName] = func;
    }),
    removeMenu: jest.fn(),
    getBounds: jest.fn(() => instance.bounds),
    setBounds: jest.fn(bounds => {
      instance.bounds = {...instance.bounds, ...bounds};
    }),
    getContentBounds: jest.fn(() => instance.contentBounds),
    setContentBounds: jest.fn(contentBounds => {
      instance.contentBounds = {...instance.contentBounds, ...contentBounds};
    }),
    setFullScreen: jest.fn(),
    show: jest.fn(),
    showInactive: jest.fn(),
    contentView: {
      addChildView: jest.fn(view => instance.contentView.children.push(view)),
      removeChildView: jest.fn(view => {
        instance.contentView.children = instance.contentView.children.filter(child => child !== view);
      }),
      children: []
    }
  };
  return instance;
};

const mockElectronInstance = ({...overriddenProps} = {}) => {
  const webContentsViewInstance = mockWebContentsViewInstance();
  const baseWindowInstance = mockBaseWindowInstance();
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
  const trayInstance = {
    destroy: jest.fn(),
    on: jest.fn()
  };
  const instance = {
    WebContentsView: jest.fn(() => webContentsViewInstance),
    webContentsViewInstance,
    BaseWindow: jest.fn(() => baseWindowInstance),
    baseWindowInstance,
    Menu: jest.fn(),
    MenuItem: jest.fn(),
    Notification: jest.fn(() => ({show: jest.fn()})),
    Tray: jest.fn(() => trayInstance),
    trayInstance,
    app: {
      commandLine: {
        appendSwitch: jest.fn()
      },
      getPath: jest.fn(),
      on: jest.fn(),
      exit: jest.fn(),
      setPath: jest.fn()
    },
    contextBridge: {
      exposeInMainWorld: jest.fn()
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
    ipcMain: {
      listeners: {},
      _listen: (eventName, func) => {
        if (instance.ipcMain.listeners[eventName]) {
          const oldFunc = instance.ipcMain.listeners[eventName];
          const newFunc = func;
          func = (event, args) => {
            oldFunc(event, args);
            newFunc(event, args);
          };
        }
        instance.ipcMain.listeners[eventName] = func;
      },
      emit: jest.fn((channel, ...event) => {
        const func = instance.ipcMain.listeners[channel];
        if (func) {
          func.call(null, ...event);
        }
      }),
      handle: jest.fn((eventName, func) => instance.ipcMain._listen(eventName, func)),
      on: jest.fn((eventName, func) => instance.ipcMain._listen(eventName, func)),
      once: jest.fn((eventName, func) => instance.ipcMain._listen(eventName, func)),
      removeHandler: jest.fn(eventName => {
        delete instance.ipcMain.listeners[eventName];
      })
    },
    ipcRenderer: {
      on: jest.fn(),
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
  mockBaseWindowInstance, mockWebContentsViewInstance, mockElectronInstance, testElectron
};
