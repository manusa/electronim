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
      userAgent: 'Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/1337.36 (KHTML, like Gecko) ElectronIM/13.337.0 Chrome/WillBeReplacedByLatestChromium Electron/0.0.99 Safari/537.36'
    }
  };
  return instance;
};

const mockElectronInstance = ({...overriddenProps} = {}) => {
  const browserViewInstance = mockBrowserWindowInstance();
  const browserWindowInstance = mockBrowserWindowInstance();
  const instance = {
    BrowserView: jest.fn(() => browserViewInstance),
    browserViewInstance,
    BrowserWindow: jest.fn(() => browserWindowInstance),
    browserWindowInstance,
    Menu: jest.fn(),
    MenuItem: jest.fn(),
    app: {
      getPath: jest.fn(),
      on: jest.fn(),
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
      emit: jest.fn(),
      handle: jest.fn((eventName, func) => {
        instance.ipcMain.listeners[eventName] = func;
      }),
      on: jest.fn((eventName, func) => {
        instance.ipcMain.listeners[eventName] = func;
      }),
      removeHandler: jest.fn(eventName => {
        delete instance.ipcMain.listeners[eventName];
      })
    },
    ipcRenderer: {
      send: jest.fn()
    },
    nativeTheme: {},
    session: {
      fromPartition: jest.fn(() => ({
        userAgentInterceptor: true
      })),
      defaultSession: {userAgentInterceptor: true}
    },
    ...overriddenProps
  };
  instance.BrowserWindow.fromWebContents = jest.fn(webContents => webContents.browserWindowInstance());
  return instance;
};

module.exports = {mockBrowserWindowInstance, mockElectronInstance};
