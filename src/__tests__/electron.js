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
    addBrowserView: jest.fn(),
    destroy: jest.fn(),
    getContentBounds: jest.fn(() => ({})),
    listeners: {},
    loadURL: jest.fn(),
    on: jest.fn((eventName, func) => {
      instance.listeners[eventName] = func;
    }),
    removeBrowserView: jest.fn(),
    removeMenu: jest.fn(),
    setAutoResize: jest.fn(),
    setBounds: jest.fn(),
    setBrowserView: jest.fn(),
    webContents: {
      copy: jest.fn(),
      copyImageAt: jest.fn(),
      cut: jest.fn(),
      destroy: jest.fn(),
      executeJavaScript: jest.fn(async () => {}),
      goBack: jest.fn(),
      loadURL: jest.fn(),
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
  return {
    BrowserView: jest.fn(() => browserViewInstance),
    browserViewInstance,
    BrowserWindow: jest.fn(() => browserWindowInstance),
    browserWindowInstance,
    Menu: jest.fn(),
    MenuItem: jest.fn(),
    app: {
      getPath: jest.fn(),
      setPath: jest.fn()
    },
    session: {
      fromPartition: jest.fn(() => ({
        userAgentInterceptor: true
      })),
      defaultSession: {userAgentInterceptor: true}
    },
    ...overriddenProps
  };
};

module.exports = {mockBrowserWindowInstance, mockElectronInstance};
