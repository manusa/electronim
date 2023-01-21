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

const mockBrowserWindowInstance = () => {
  const instance = {
    listeners: {},
    addBrowserView: jest.fn(),
    destroy: jest.fn(),
    getContentBounds: jest.fn(() => ({})),
    isFullScreen: jest.fn(),
    loadURL: jest.fn(),
    minimize: jest.fn(),
    on: jest.fn((eventName, func) => {
      instance.listeners[eventName] = func;
    }),
    removeBrowserView: jest.fn(),
    removeMenu: jest.fn(),
    setAutoResize: jest.fn(),
    setBounds: jest.fn(),
    setBrowserView: jest.fn(),
    setFullScreen: jest.fn(),
    webContents: {
      loadedUrl: '',
      browserWindowInstance: () => instance,
      copy: jest.fn(),
      copyImageAt: jest.fn(),
      cut: jest.fn(),
      destroy: jest.fn(),
      executeJavaScript: jest.fn(async () => {}),
      focus: jest.fn(),
      getURL: jest.fn(),
      goBack: jest.fn(),
      loadURL: jest.fn(url => {
        instance.webContents.loadedUrl = url;
      }),
      on: jest.fn((...args) => instance.on(...args)),
      openDevTools: jest.fn(),
      paste: jest.fn(),
      reload: jest.fn(),
      send: jest.fn(),
      session: {},
      setWindowOpenHandler: jest.fn(),
      userAgent: 'Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) ElectronIM/13.337.0 Chrome/WillBeReplacedByLatestChromium Electron/0.0.99 Safari/537.36'
    }
  };
  return instance;
};

const mockElectronInstance = ({...overriddenProps} = {}) => {
  const browserViewInstance = mockBrowserWindowInstance();
  const browserWindowInstance = mockBrowserWindowInstance();
  const sessionInstance = {
    clearCache: jest.fn(),
    clearCodeCaches: jest.fn(),
    clearHostResolverCache: jest.fn(),
    clearStorageData: jest.fn(),
    userAgentInterceptor: true
  };
  const trayInstance = {
    destroy: jest.fn(),
    on: jest.fn()
  };
  const instance = {
    BrowserView: jest.fn(() => browserViewInstance),
    browserViewInstance,
    BrowserWindow: jest.fn(() => browserWindowInstance),
    browserWindowInstance,
    Menu: jest.fn(),
    MenuItem: jest.fn(),
    Notification: jest.fn(),
    Tray: jest.fn(() => trayInstance),
    trayInstance,
    app: {
      getPath: jest.fn(),
      on: jest.fn(),
      exit: jest.fn(),
      setPath: jest.fn()
    },
    contextBridge: {
      exposeInMainWorld: jest.fn()
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
      emit: jest.fn((channel, event) => {
        const func = instance.ipcMain.listeners[channel];
        if (func) {
          func(event);
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
      send: jest.fn()
    },
    nativeTheme: {},
    session: {
      fromPartition: jest.fn(() => sessionInstance),
      defaultSession: sessionInstance
    },
    shell: {
      openExternal: jest.fn()
    },
    ...overriddenProps
  };
  instance.BrowserWindow.fromWebContents = jest.fn(webContents => webContents.browserWindowInstance());
  return instance;
};

module.exports = {mockBrowserWindowInstance, mockElectronInstance};
