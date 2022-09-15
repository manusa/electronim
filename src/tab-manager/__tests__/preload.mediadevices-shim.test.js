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
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: {
      }
    });
  });
  beforeEach(() => {
    jest.resetModules();
    mockThumbnail = {
      toDataURL: jest.fn()
    };
    global.APP_EVENTS = {
      desktopCapturerGetSources: 'desktopCapturerGetSources'
    };
    jest.mock('electron', () => ({
      ipcRenderer: {
        invoke: jest.fn(async () => [
          {id: '1337', name: '1337', thumbnail: mockThumbnail},
          {id: '313373', name: 'Other Window', thumbnail: mockThumbnail}
        ])
      }
    }));
    electron = require('electron');
    window.navigator.mediaDevices.getUserMedia = jest.fn(um => um.video.mandatory.chromeMediaSourceId);
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
      window.navigator.mediaDevices.getDisplayMedia();
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
      window.navigator.mediaDevices.getDisplayMedia();
      // Then
      expect(preact.render).toHaveBeenCalledTimes(1);
      expect(await screen.findByText('No sources found')).not.toBeNull();
      expect(electron.ipcRenderer.invoke).toHaveBeenCalled();
    });
    test('mediaDevices.getDisplayMedia, should render media selector when sources are loaded', async () => {
      // When
      window.navigator.mediaDevices.getDisplayMedia();
      // Then
      expect(preact.render).toHaveBeenCalledTimes(1);
      await waitFor(() =>
        expect(document.querySelector('.electron-desktop-capturer-root__source')).not.toBeNull());
      expect(electron.ipcRenderer.invoke).toHaveBeenCalled();
      expect(document.querySelectorAll('.electron-desktop-capturer-root__source')).toHaveLength(2);
      expect(mockThumbnail.toDataURL).toHaveBeenCalledTimes(2);
    });
  });
  describe('events', () => {
    test('select stream, should remove selector and resolve promise', async () => {
      // Given
      const promise = window.navigator.mediaDevices.getDisplayMedia();
      const $source = await screen.findByText('Other Window');
      // When
      fireEvent.click($source);
      // Then
      await waitFor(() =>
        expect(document.querySelector('.electron-desktop-capturer-root__sources')).toBeNull());
      expect(window.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        {audio: false, video: {mandatory: {
          chromeMediaSource: 'desktop', chromeMediaSourceId: '313373'}}
        });
      expect(preact.render).toHaveBeenCalledTimes(2);
      await expect(promise).resolves.toBe('313373');
    });
    test('click on sources, should cancel: remove selector and do nothing', async () => {
      // Given
      const promise = window.navigator.mediaDevices.getDisplayMedia();
      await waitFor(() =>
        expect(document.querySelector('.electron-desktop-capturer-root__sources')).not.toBeNull());
      // When
      fireEvent.click(document.querySelector('.electron-desktop-capturer-root__sources'));
      // Then
      await waitFor(() =>
        expect(document.querySelector('.electron-desktop-capturer-root__sources')).toBeNull());
      expect(window.navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
      expect(preact.render).toHaveBeenCalledTimes(2);
      await expect(promise).rejects.toEqual(new Error('Screen share aborted by user'));
    });
    test('click on overlay, should cancel: remove selector and do nothing', async () => {
      // Given
      const promise = window.navigator.mediaDevices.getDisplayMedia();
      await waitFor(() =>
        expect(document.querySelector('.electron-desktop-capturer-root__sources')).not.toBeNull());
      // When
      fireEvent.click(document.querySelector('.electron-desktop-capturer-root__overlay'));
      // Then
      await waitFor(() =>
        expect(document.querySelector('.electron-desktop-capturer-root__sources')).toBeNull());
      expect(window.navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
      expect(preact.render).toHaveBeenCalledTimes(2);
      await expect(promise).rejects.toEqual(new Error('Screen share aborted by user'));
    });
  });
});
