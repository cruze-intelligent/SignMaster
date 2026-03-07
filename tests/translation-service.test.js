import { describe, it, expect, beforeEach } from 'vitest';
import acholiGlossary from '../src/data/acholi-glossary.json';
import translationService from '../src/services/TranslationService.js';

describe('TranslationService offline Acholi glossary', () => {
  beforeEach(() => {
    translationService.currentLanguage = 'ach';
  });

  it('has unique normalized glossary terms and aliases', () => {
    const seen = new Set();

    acholiGlossary.searchTerms.forEach(entry => {
      [entry.term, ...(entry.aliases || [])].forEach(term => {
        const normalized = translationService.normalizeSearchTerm(term);
        expect(seen.has(normalized), `Duplicate glossary term: ${normalized}`).toBe(false);
        seen.add(normalized);
      });
    });
  });

  it('resolves an exact Acholi query locally', () => {
    const result = translationService.resolveSearchQuery('apwoyo');
    expect(result.translated).toBe(true);
    expect(result.resolvedQuery).toBe('thank you');
  });

  it('resolves multiword Acholi queries locally', () => {
    const result = translationService.resolveSearchQuery('atye maber');
    expect(result.translated).toBe(true);
    expect(result.resolvedQuery).toBe('i am fine');
  });

  it('falls back to the original query for unknown terms', () => {
    const result = translationService.resolveSearchQuery('pekoc');
    expect(result.translated).toBe(false);
    expect(result.resolvedQuery).toBe('pekoc');
  });

  it('uses the offline Acholi search placeholder', () => {
    expect(translationService.getSearchPlaceholder()).toMatch(/Acholi/);
  });
});
