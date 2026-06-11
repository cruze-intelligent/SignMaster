import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import acholiGlossary from '../src/data/acholi-glossary.json';
import translationService from '../src/services/TranslationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

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

  it('has Acholi entries for every English UI key', () => {
    const englishKeys = Object.keys(translationService.builtInTranslations.en);
    const missing = englishKeys.filter(key => !acholiGlossary.ui[key]);
    expect(missing, `Missing Acholi UI translations: ${missing.join(', ')}`).toEqual([]);
  });

  it('has translation entries for every static data-i18n key', () => {
    const staticKeys = Array.from(indexHtml.matchAll(/data-i18n="([^"]+)"/g)).map(match => match[1]);
    const uniqueStaticKeys = [...new Set(staticKeys)];
    const missing = uniqueStaticKeys.filter(key => !translationService.builtInTranslations.en[key]);
    expect(missing, `Missing static UI translation keys: ${missing.join(', ')}`).toEqual([]);
  });
});
