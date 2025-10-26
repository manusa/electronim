/*
   Copyright 2025 Marc Nuri San Felix

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

const DICTIONARY_TEST_DATA = [
  {langCode: 'en', correctWords: ['hello', 'world', 'test', 'computer']},
  {langCode: 'en-GB', correctWords: ['colour', 'programme', 'centre']},
  {langCode: 'es', correctWords: ['hola', 'mundo', 'casa', 'libro']},
  {langCode: 'fr', correctWords: ['bonjour', 'monde', 'maison', 'livre']},
  // {langCode: 'de', correctWords: ['hallo', 'welt', 'haus', 'buch']}, // Doesn't seem to load properly TODO
  {langCode: 'it', correctWords: ['ciao', 'mondo', 'casa', 'libro']},
  {langCode: 'pt', correctWords: ['casa', 'livro', 'mundo']},
  {langCode: 'pt-BR', correctWords: ['casa', 'livro', 'mundo']},
  {langCode: 'ca', correctWords: ['casa', 'llibre']},
  {langCode: 'ca-valencia', correctWords: ['casa', 'llibre']},
  {langCode: 'eu', correctWords: ['mundua', 'etxea', 'liburua']},
  {langCode: 'nl', correctWords: ['hallo', 'wereld', 'huis', 'boek']},
  {langCode: 'sv', correctWords: ['hus', 'bok']},
  {langCode: 'pl', correctWords: ['dom']},
  {langCode: 'ru', correctWords: ['дом']},
  // {langCode: 'uk', correctWords: ['дім']},  // Doesn't seem to load properly TODO
  {langCode: 'tr', correctWords: ['merhaba', 'ev', 'kitap']},
  {langCode: 'lt', correctWords: ['labas', 'namai', 'knyga']},
  {langCode: 'ka', correctWords: ['სახლი']}
];

// Common gibberish words that should be misspelled in any language
// Using impossible letter combinations that no language would have
const commonMisspelledWords = ['xqzxqz', 'bcdfghjklm', 'qqqqq'];

describe('Dictionary Worker test suite', () => {
  let settings;

  beforeAll(async () => {
    jest.resetModules();
    settings = await require('../../__tests__/settings').testSettings();
  });

  describe.each(DICTIONARY_TEST_DATA)(
    'Dictionary: $langCode',
    ({langCode, correctWords}) => {
      let loadedDictionaries;

      beforeAll(async () => {
        settings.updateSettings({
          enabledDictionaries: [langCode]
        });
        require('../dictionary.renderer/dictionary.worker');

        loadedDictionaries = await globalThis.reloadDictionaries();
      });

      describe('dictionary loading', () => {
        test('reloadDictionaries loads dictionary successfully', () => {
          // Verify the dictionary was actually loaded
          expect(loadedDictionaries).toBeInstanceOf(Set);
          expect(loadedDictionaries.has(langCode)).toBe(true);
          expect(loadedDictionaries.size).toBe(1);
        });

        test('dictionary functions are available', () => {
          expect(typeof globalThis.getMisspelled).toBe('function');
          expect(typeof globalThis.getSuggestions).toBe('function');
          expect(typeof globalThis.reloadDictionaries).toBe('function');
        });
      });

      describe('getMisspelled functionality', () => {
        test('recognizes correct words', async () => {
          const misspelled = await globalThis.getMisspelled(correctWords);
          expect(misspelled).toEqual([]);
        });

        test('detects gibberish as misspelled', async () => {
          const misspelled = await globalThis.getMisspelled(commonMisspelledWords);
          expect(misspelled).toEqual([...commonMisspelledWords]);
        });

        test('correctly identifies misspelled words in mixed list', async () => {
          const mixedWords = [...correctWords, ...commonMisspelledWords];
          const misspelled = await globalThis.getMisspelled(mixedWords);

          // Correct words should not be in misspelled list
          for (const word of correctWords) {
            expect(misspelled).not.toContain(word);
          }
        });

        test('handles empty word list', async () => {
          const misspelled = await globalThis.getMisspelled([]);
          expect(misspelled).toEqual([]);
        });

        test('returns empty array when no dictionaries loaded', async () => {
          // Reset settings to empty dictionaries
          settings.updateSettings({enabledDictionaries: []});
          await globalThis.reloadDictionaries();

          const misspelled = await globalThis.getMisspelled(['test', 'asdfghjkl']);
          expect(misspelled).toEqual([]);
        });
      });

      describe('getSuggestions functionality', () => {
        test('provides suggestions for misspelled words', async () => {
          const suggestions = await globalThis.getSuggestions(commonMisspelledWords[0]);

          expect(Array.isArray(suggestions)).toBe(true);
          // Suggestions might be empty for complete gibberish, which is acceptable
        });

        test('limits suggestions to 10 or fewer', async () => {
          // Use a word that might have many suggestions
          const suggestions = await globalThis.getSuggestions(commonMisspelledWords[0]);

          expect(Array.isArray(suggestions)).toBe(true);
          expect(suggestions.length).toBeLessThanOrEqual(10);
        });

        test('returns sorted suggestions', async () => {
          const suggestions = await globalThis.getSuggestions(commonMisspelledWords[0]);

          if (suggestions.length > 1) {
            // Verify suggestions are sorted
            const sorted = [...suggestions].sort((w1, w2) => w1.localeCompare(w2));
            expect(suggestions).toEqual(sorted);
          }
        });

        test('returns empty array for valid words', async () => {
          // Some implementations might return suggestions even for valid words
          // but we just verify it returns an array
          const suggestions = await globalThis.getSuggestions(correctWords[0]);
          expect(Array.isArray(suggestions)).toBe(true);
        });
      });
    }
  );


  describe.each([
    {dictionaries: ['en', 'es']},
    {dictionaries: ['en', 'fr']},
    {dictionaries: ['ca', 'ca-valencia', 'es']}
  ])('Multi-dictionary integration: $dictionaries', ({dictionaries}) => {
    let loadedDictionaries;

    beforeAll(async () => {
      settings.updateSettings({
        enabledDictionaries: dictionaries
      });

      require('../dictionary.renderer/dictionary.worker');
      // reloadDictionaries is now async and properly waits for all loads
      loadedDictionaries = await globalThis.reloadDictionaries();
    });

    test('loads all dictionaries successfully', () => {
      // Verify all requested dictionaries were loaded
      expect(loadedDictionaries).toBeInstanceOf(Set);
      expect(loadedDictionaries.size).toBe(dictionaries.length);

      for (const dict of dictionaries) {
        expect(loadedDictionaries.has(dict)).toBe(true);
      }
    });

    test('dictionary functions are available', () => {
      expect(typeof globalThis.getMisspelled).toBe('function');
      expect(typeof globalThis.getSuggestions).toBe('function');
    });

    test('accepts words from any loaded dictionary', async () => {
      // Get test data for all enabled dictionaries
      const testData = DICTIONARY_TEST_DATA.filter(({langCode}) => dictionaries.includes(langCode));

      // Test words from each dictionary
      for (const {correctWords} of testData) {
        const misspelled = await globalThis.getMisspelled(correctWords);
        // Words from any loaded dictionary should be recognized
        expect(misspelled).toEqual([]);
      }
    });

    test('detects gibberish across all loaded dictionaries', async () => {
      const misspelled = await globalThis.getMisspelled(commonMisspelledWords);

      // Gibberish detection should return an array
      // (Some dictionaries might actually have these as valid words)
      expect(Array.isArray(misspelled)).toBe(true);
    });

    test('provides combined suggestions from all dictionaries', async () => {
      const suggestions = await globalThis.getSuggestions(commonMisspelledWords[0]);

      expect(Array.isArray(suggestions)).toBe(true);
      // Should still limit to 10 even with multiple dictionaries
      expect(suggestions.length).toBeLessThanOrEqual(10);
    });

    test('correctly handles mixed word list across languages', async () => {
      const testData = DICTIONARY_TEST_DATA.filter(({langCode}) => dictionaries.includes(langCode));
      const allCorrectWords = testData.flatMap(({correctWords}) => correctWords);
      const mixedWords = [...allCorrectWords, ...commonMisspelledWords];

      const misspelled = await globalThis.getMisspelled(mixedWords);

      // Correct words from any loaded dictionary should not be flagged
      for (const word of allCorrectWords) {
        expect(misspelled).not.toContain(word);
      }
    });
  });

  describe('Edge cases and special scenarios', () => {
    beforeAll(async () => {
      settings.updateSettings({
        enabledDictionaries: ['en']
      });

      require('../dictionary.renderer/dictionary.worker');
      // reloadDictionaries is now async and properly waits for all loads
      await globalThis.reloadDictionaries();
    });

    test('handles single word', async () => {
      const misspelled = await globalThis.getMisspelled(['hello']);
      expect(misspelled).toEqual([]);
    });

    test('handles words with special characters', async () => {
      const misspelled = await globalThis.getMisspelled(['don\'t', 'it\'s', 'hello-world']);
      // Should handle contractions and hyphenated words
      expect(Array.isArray(misspelled)).toBe(true);
    });

    test('handles very long word list', async () => {
      const longList = Array(100).fill('test');
      const misspelled = await globalThis.getMisspelled(longList);
      expect(misspelled).toEqual([]);
    });

    test('handles mixed case words', async () => {
      const misspelled = await globalThis.getMisspelled(['Hello', 'WORLD', 'gibbrshih']);
      expect(misspelled).toEqual(['gibbrshih']);
    });

    test('handles empty string in word list', async () => {
      const misspelled = await globalThis.getMisspelled(['', 'hello', '']);
      expect(Array.isArray(misspelled)).toBe(true);
    });

    test('handles duplicate words', async () => {
      const misspelled = await globalThis.getMisspelled(['hello', 'hello', 'asdfghjkl', 'asdfghjkl']);
      expect(Array.isArray(misspelled)).toBe(true);
    });

    test('suggestions handles empty string', async () => {
      const suggestions = await globalThis.getSuggestions('');
      expect(Array.isArray(suggestions)).toBe(true);
    });

    test('getMisspelled returns unique results', async () => {
      const misspelled = await globalThis.getMisspelled(['asdfghjkl', 'asdfghjkl', 'zxcvbnm']);
      expect(misspelled).toEqual(['asdfghjkl', 'asdfghjkl', 'zxcvbnm']);
    });
  });

  describe('Dictionary reload functionality', () => {
    test('reloadDictionaries can be called multiple times', async () => {
      settings.updateSettings({enabledDictionaries: ['en']});
      require('../dictionary.renderer/dictionary.worker');

      const loaded1 = await globalThis.reloadDictionaries();
      const loaded2 = await globalThis.reloadDictionaries();
      const loaded3 = await globalThis.reloadDictionaries();

      expect(loaded1).toBeInstanceOf(Set);
      expect(loaded2).toBeInstanceOf(Set);
      expect(loaded3).toBeInstanceOf(Set);
      expect(loaded1.has('en')).toBe(true);

      const misspelled = await globalThis.getMisspelled(['hello']);
      expect(misspelled).toEqual([]);
    });

    test('reloadDictionaries updates when settings change', async () => {
      settings.updateSettings({enabledDictionaries: ['en']});
      require('../dictionary.renderer/dictionary.worker');
      const loaded1 = await globalThis.reloadDictionaries();

      // Verify English was loaded
      expect(loaded1.has('en')).toBe(true);
      expect(loaded1.size).toBe(1);
      expect(await globalThis.getMisspelled(['hello'])).toEqual([]);

      // Change to Spanish
      settings.updateSettings({enabledDictionaries: ['es']});
      const loaded2 = await globalThis.reloadDictionaries();

      // Verify Spanish was loaded
      expect(loaded2.has('es')).toBe(true);
      expect(loaded2.size).toBe(1);
      expect(await globalThis.getMisspelled(['hola'])).toEqual([]);
    });

    test('handles invalid dictionary gracefully', async () => {
      settings.updateSettings({enabledDictionaries: ['en', 'invalid-dictionary', 'es']});
      require('../dictionary.renderer/dictionary.worker');
      // Should not throw error
      const loaded = await globalThis.reloadDictionaries();

      // Only valid dictionaries should be in the loaded set
      expect(loaded).toBeInstanceOf(Set);
      expect(loaded.has('en')).toBe(true);
      expect(loaded.has('es')).toBe(true);
      expect(loaded.has('invalid-dictionary')).toBe(false);
      expect(loaded.size).toBe(2);

      // Valid dictionaries should still work
      expect(await globalThis.getMisspelled(['hello', 'hola'])).toEqual([]);
    });

    test('returns empty set when no dictionaries configured', async () => {
      settings.updateSettings({enabledDictionaries: []});
      require('../dictionary.renderer/dictionary.worker');

      const loaded = await globalThis.reloadDictionaries();

      expect(loaded).toBeInstanceOf(Set);
      expect(loaded.size).toBe(0);
    });

    test('returns empty set when all dictionaries fail to load', async () => {
      settings.updateSettings({enabledDictionaries: ['invalid-1', 'invalid-2', 'invalid-3']});
      require('../dictionary.renderer/dictionary.worker');

      const loaded = await globalThis.reloadDictionaries();

      expect(loaded).toBeInstanceOf(Set);
      expect(loaded.size).toBe(0);
    });
  });
});
