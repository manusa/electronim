describe('Spell-check module test suite', () => {
  let mockSettings;
  let spellCheck;
  beforeEach(() => {
    mockSettings = {
      enabledDictionaries: []
    };
    jest.resetModules();
    jest.mock('../../settings', () => ({
      loadSettings: jest.fn(() => mockSettings)
    }));
    spellCheck = require('../');
  });
  test('getEnabledDictionaries, should return persisted enabled dictionaries', () => {
    // Given
    mockSettings.enabledDictionaries = ['13-37'];
    // When
    const result = spellCheck.getEnabledDictionaries();
    // Then
    expect(result).toEqual(['13-37']);
  });
});
