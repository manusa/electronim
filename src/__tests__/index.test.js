describe('Entrypoint test suite', () => {
  let app;
  let main;
  beforeEach(() => {
    jest.resetModules();
    jest.mock('electron', () => ({
      app: {
        setName: jest.fn(),
        on: jest.fn()
      }
    }));
    jest.mock('../main', () => ({
      init: jest.fn()
    }));
    app = require('electron').app;
    main = require('../main');
  });
  test('App initialization', () => {
    // Given
    // When
    require('../index');
    // Then
    expect(app.setName).toHaveBeenCalledTimes(1);
    expect(app.setName).toHaveBeenCalledWith('ElectronIM');
    expect(app.on).toHaveBeenCalledTimes(1);
    expect(app.on). toHaveBeenCalledWith('ready', main.init);
  });
});
