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
const {screen, fireEvent, waitFor} = require('@testing-library/dom');

describe('Browser mediaDevices shim test suite', () => {
  let mockThumbnail;
  let electron;
  let preact;
  beforeAll(() => {
    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      value: {
      }
    });
  });
  beforeEach(() => {
    jest.resetModules();
    mockThumbnail = {
      toDataURL: jest.fn(() => 'data:image/png;base64,mockdata'),
      isEmpty: jest.fn(() => false)
    };
    globalThis.APP_EVENTS = {
      desktopCapturerGetSources: 'desktopCapturerGetSources'
    };
    electron = require('../../__tests__').testElectron();
    electron.ipcRenderer.invoke = jest.fn(async () => [
      {id: '1337', name: '1337', thumbnail: mockThumbnail},
      {id: '313373', name: 'Other Window', thumbnail: mockThumbnail}
    ]);
    globalThis.navigator.mediaDevices.getUserMedia = jest.fn(um => um.video.mandatory.chromeMediaSourceId);
    document.body.innerHTML = '';
    jest.isolateModules(() => {
      preact = require('preact');
      jest.spyOn(preact, 'render');
      require('../preload.mediadevices-shim');
    });
  });
  describe('ui', () => {
    test('mediaDevices.getDisplayMedia, should render overlay immediately', async () => {
      // When
      globalThis.navigator.mediaDevices.getDisplayMedia();
      // Then
      expect(preact.render).toHaveBeenCalledTimes(1);
      const $sources = document.querySelector('.electron-desktop-capturer-root');
      expect($sources).not.toBeNull();
      expect(await screen.findByText('Loading sources...')).not.toBeNull();
      expect(electron.ipcRenderer.invoke).not.toHaveBeenCalled();
    });
    test('mediaDevices.getDisplayMedia, should render no sources found', async () => {
      // Given
      electron.ipcRenderer.invoke = jest.fn(() => []);
      // When
      globalThis.navigator.mediaDevices.getDisplayMedia();
      // Then
      expect(preact.render).toHaveBeenCalledTimes(1);
      expect(await screen.findByText('No sources found')).not.toBeNull();
      expect(electron.ipcRenderer.invoke).toHaveBeenCalled();
    });
    test('mediaDevices.getDisplayMedia, should render media selector when sources are loaded', async () => {
      // When
      globalThis.navigator.mediaDevices.getDisplayMedia();
      // Then
      expect(preact.render).toHaveBeenCalledTimes(1);
      await waitFor(() =>
        expect(document.querySelector('.electron-desktop-capturer-root__source')).not.toBeNull());
      expect(electron.ipcRenderer.invoke).toHaveBeenCalled();
      expect(document.querySelectorAll('.electron-desktop-capturer-root__source')).toHaveLength(2);
      expect(mockThumbnail.isEmpty).toHaveBeenCalled();
      expect(mockThumbnail.toDataURL).toHaveBeenCalled();
    });
    test('mediaDevices.getDisplayMedia, should render placeholder for hidden windows with empty thumbnails', async () => {
      // Given
      const emptyThumbnail = {
        toDataURL: jest.fn(() => ''),
        isEmpty: jest.fn(() => true)
      };
      electron.ipcRenderer.invoke = jest.fn(async () => [
        {id: 'hidden-window', name: 'Hidden Window', thumbnail: emptyThumbnail}
      ]);
      // When
      globalThis.navigator.mediaDevices.getDisplayMedia();
      // Then
      await waitFor(() =>
        expect(document.querySelector('.electron-desktop-capturer-root__source')).not.toBeNull());
      expect(emptyThumbnail.isEmpty).toHaveBeenCalled();
      expect(emptyThumbnail.toDataURL).not.toHaveBeenCalled();
      const placeholder = document.querySelector('.electron-desktop-capturer-root__thumbnail--placeholder');
      expect(placeholder).not.toBeNull();
      expect(document.querySelector('img.electron-desktop-capturer-root__thumbnail')).toBeNull();
    });
  });
  describe('sorting', () => {
    test('should display screens (with display_id) before windows', async () => {
      // Given - windows listed before screens in the response
      const screenThumbnail = {toDataURL: jest.fn(() => 'screen-data'), isEmpty: jest.fn(() => false)};
      const windowThumbnail = {toDataURL: jest.fn(() => 'window-data'), isEmpty: jest.fn(() => false)};
      electron.ipcRenderer.invoke = jest.fn(async () => [
        {id: 'window:1', name: 'Chrome', thumbnail: windowThumbnail},
        {id: 'screen:0', name: 'Screen 1', display_id: '123', thumbnail: screenThumbnail},
        {id: 'window:2', name: 'Firefox', thumbnail: windowThumbnail}
      ]);
      // When
      globalThis.navigator.mediaDevices.getDisplayMedia();
      // Then
      await waitFor(() =>
        expect(document.querySelectorAll('.electron-desktop-capturer-root__source')).toHaveLength(3));
      const sources = document.querySelectorAll('.electron-desktop-capturer-root__source .electron-desktop-capturer-root__name');
      expect(sources[0].textContent).toBe('Screen 1');
      expect(sources[1].textContent).toBe('Chrome');
      expect(sources[2].textContent).toBe('Firefox');
    });
    test('should sort screens alphabetically by name', async () => {
      // Given
      const thumbnail = {toDataURL: jest.fn(() => 'data'), isEmpty: jest.fn(() => false)};
      electron.ipcRenderer.invoke = jest.fn(async () => [
        {id: 'screen:2', name: 'Screen 3', display_id: '789', thumbnail},
        {id: 'screen:0', name: 'Screen 1', display_id: '123', thumbnail},
        {id: 'screen:1', name: 'Screen 2', display_id: '456', thumbnail}
      ]);
      // When
      globalThis.navigator.mediaDevices.getDisplayMedia();
      // Then
      await waitFor(() =>
        expect(document.querySelectorAll('.electron-desktop-capturer-root__source')).toHaveLength(3));
      const sources = document.querySelectorAll('.electron-desktop-capturer-root__source .electron-desktop-capturer-root__name');
      expect(sources[0].textContent).toBe('Screen 1');
      expect(sources[1].textContent).toBe('Screen 2');
      expect(sources[2].textContent).toBe('Screen 3');
    });
    test('should sort windows alphabetically by name', async () => {
      // Given
      const thumbnail = {toDataURL: jest.fn(() => 'data'), isEmpty: jest.fn(() => false)};
      electron.ipcRenderer.invoke = jest.fn(async () => [
        {id: 'window:2', name: 'Zoom', thumbnail},
        {id: 'window:0', name: 'Chrome', thumbnail},
        {id: 'window:1', name: 'Firefox', thumbnail}
      ]);
      // When
      globalThis.navigator.mediaDevices.getDisplayMedia();
      // Then
      await waitFor(() =>
        expect(document.querySelectorAll('.electron-desktop-capturer-root__source')).toHaveLength(3));
      const sources = document.querySelectorAll('.electron-desktop-capturer-root__source .electron-desktop-capturer-root__name');
      expect(sources[0].textContent).toBe('Chrome');
      expect(sources[1].textContent).toBe('Firefox');
      expect(sources[2].textContent).toBe('Zoom');
    });
    test('should maintain stable order: screens alphabetically, then windows alphabetically', async () => {
      // Given
      const thumbnail = {toDataURL: jest.fn(() => 'data'), isEmpty: jest.fn(() => false)};
      electron.ipcRenderer.invoke = jest.fn(async () => [
        {id: 'window:3', name: 'Zoom', thumbnail},
        {id: 'screen:1', name: 'Display 2', display_id: '456', thumbnail},
        {id: 'window:1', name: 'Chrome', thumbnail},
        {id: 'screen:0', name: 'Display 1', display_id: '123', thumbnail},
        {id: 'window:2', name: 'Firefox', thumbnail}
      ]);
      // When
      globalThis.navigator.mediaDevices.getDisplayMedia();
      // Then
      await waitFor(() =>
        expect(document.querySelectorAll('.electron-desktop-capturer-root__source')).toHaveLength(5));
      const sources = document.querySelectorAll('.electron-desktop-capturer-root__source .electron-desktop-capturer-root__name');
      // Screens first, alphabetically
      expect(sources[0].textContent).toBe('Display 1');
      expect(sources[1].textContent).toBe('Display 2');
      // Windows second, alphabetically
      expect(sources[2].textContent).toBe('Chrome');
      expect(sources[3].textContent).toBe('Firefox');
      expect(sources[4].textContent).toBe('Zoom');
    });
  });
  describe('thumbnail caching', () => {
    test('should show placeholder when initial thumbnail is missing', async () => {
      // Given - no thumbnail on first fetch
      electron.ipcRenderer.invoke = jest.fn(async () => [
        {id: 'window:1', name: 'Chrome', thumbnail: null}
      ]);
      // When
      globalThis.navigator.mediaDevices.getDisplayMedia();
      // Then
      await waitFor(() =>
        expect(document.querySelector('.electron-desktop-capturer-root__source')).not.toBeNull());
      expect(document.querySelector('.electron-desktop-capturer-root__thumbnail--placeholder')).not.toBeNull();
      expect(document.querySelector('img.electron-desktop-capturer-root__thumbnail')).toBeNull();
    });
    test('should show thumbnail when it becomes available', async () => {
      // Given - thumbnail becomes available on second fetch
      const validThumbnail = {
        toDataURL: jest.fn(() => 'data:image/png;base64,validdata'),
        isEmpty: jest.fn(() => false)
      };
      let callCount = 0;
      electron.ipcRenderer.invoke = jest.fn(async () => {
        callCount++;
        if (callCount === 1) {
          return [{id: 'window:1', name: 'Chrome', thumbnail: null}];
        }
        return [{id: 'window:1', name: 'Chrome', thumbnail: validThumbnail}];
      });
      // When
      globalThis.navigator.mediaDevices.getDisplayMedia();
      // Then - first shows placeholder
      await waitFor(() =>
        expect(document.querySelector('.electron-desktop-capturer-root__thumbnail--placeholder')).not.toBeNull());
      // Then - eventually shows thumbnail
      await waitFor(() =>
        expect(document.querySelector('img.electron-desktop-capturer-root__thumbnail')).not.toBeNull(),
      {timeout: 1000});
      expect(document.querySelector('.electron-desktop-capturer-root__thumbnail--placeholder')).toBeNull();
    });
    test('should preserve thumbnail when subsequent fetches have no thumbnail', async () => {
      // Given - thumbnail available initially, then missing
      const validThumbnail = {
        toDataURL: jest.fn(() => 'data:image/png;base64,cacheddata'),
        isEmpty: jest.fn(() => false)
      };
      let callCount = 0;
      electron.ipcRenderer.invoke = jest.fn(async () => {
        callCount++;
        if (callCount === 1) {
          return [{id: 'window:1', name: 'Chrome', thumbnail: validThumbnail}];
        }
        return [{id: 'window:1', name: 'Chrome', thumbnail: null}];
      });
      // When
      globalThis.navigator.mediaDevices.getDisplayMedia();
      // Then - shows thumbnail initially
      await waitFor(() =>
        expect(document.querySelector('img.electron-desktop-capturer-root__thumbnail')).not.toBeNull());
      const firstImage = document.querySelector('img.electron-desktop-capturer-root__thumbnail');
      expect(firstImage.src).toBe('data:image/png;base64,cacheddata');
      // Wait for next poll (300ms + buffer)
      await new Promise(resolve => setTimeout(resolve, 400));
      // Then - thumbnail is still visible (cached)
      const secondImage = document.querySelector('img.electron-desktop-capturer-root__thumbnail');
      expect(secondImage).not.toBeNull();
      expect(secondImage.src).toBe('data:image/png;base64,cacheddata');
      expect(document.querySelector('.electron-desktop-capturer-root__thumbnail--placeholder')).toBeNull();
    });
  });
  describe('events', () => {
    test('select stream, should remove selector and resolve promise', async () => {
      // Given
      const promise = globalThis.navigator.mediaDevices.getDisplayMedia();
      const $source = await screen.findByText('Other Window');
      // When
      fireEvent.click($source);
      // Then
      await waitFor(() =>
        expect(document.querySelector('.electron-desktop-capturer-root__sources')).toBeNull());
      expect(globalThis.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        {audio: false, video: {mandatory: {
          chromeMediaSource: 'desktop', chromeMediaSourceId: '313373'}}
        });
      expect(preact.render).toHaveBeenCalledTimes(2);
      await expect(promise).resolves.toBe('313373');
    });
    test('click on sources, should cancel: remove selector and do nothing', async () => {
      // Given
      const promise = globalThis.navigator.mediaDevices.getDisplayMedia();
      await waitFor(() =>
        expect(document.querySelector('.electron-desktop-capturer-root__sources')).not.toBeNull());
      // When
      fireEvent.click(document.querySelector('.electron-desktop-capturer-root__sources'));
      // Then
      await waitFor(() =>
        expect(document.querySelector('.electron-desktop-capturer-root__sources')).toBeNull());
      expect(globalThis.navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
      expect(preact.render).toHaveBeenCalledTimes(2);
      await expect(promise).rejects.toEqual(new Error('Screen share aborted by user'));
    });
    test('click on overlay, should cancel: remove selector and do nothing', async () => {
      // Given
      const promise = globalThis.navigator.mediaDevices.getDisplayMedia();
      await waitFor(() =>
        expect(document.querySelector('.electron-desktop-capturer-root__sources')).not.toBeNull());
      // When
      fireEvent.click(document.querySelector('.electron-desktop-capturer-root__overlay'));
      // Then
      await waitFor(() =>
        expect(document.querySelector('.electron-desktop-capturer-root__sources')).toBeNull());
      expect(globalThis.navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
      expect(preact.render).toHaveBeenCalledTimes(2);
      await expect(promise).rejects.toEqual(new Error('Screen share aborted by user'));
    });
  });
});
