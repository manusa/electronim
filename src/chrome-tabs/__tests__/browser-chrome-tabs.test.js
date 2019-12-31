describe('ChromeTabs in Browser test suite', () => {
  let mockChromeTabs;
  let mockIpcRenderer;
  beforeEach(() => {
    mockChromeTabs = {
      init: jest.fn()
    };
    mockIpcRenderer = {
      on: jest.fn(),
      send: jest.fn()
    };
    window.ChromeTabs = jest.fn(() => mockChromeTabs);
    window.ipcRenderer = mockIpcRenderer;
    window.APP_EVENTS = {};
    ['chrome-tabs', 'settings__button'].forEach(className => {
      const $domElement = document.createElement('div');
      $domElement.innerHTML = `<div class="${className}"></div>`;
      document.body.append($domElement);
    });
    require('../browser-chrome-tabs');
  });
  test('settingsButton click, should dispatch APP_EVENTS.settingsOpenDialog', () => {
    // Given
    window.APP_EVENTS.settingsOpenDialog = 'open your settings please';
    const $settingsButton = document.querySelector('.settings__button');
    // When
    $settingsButton.dispatchEvent(new Event('click'));
    // Then
    expect(mockIpcRenderer.send).toHaveBeenCalledWith('open your settings please');
  });
});

