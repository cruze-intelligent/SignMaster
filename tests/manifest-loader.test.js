import { describe, it, expect, beforeAll } from 'vitest';
import manifestLoader from '../src/services/ManifestLoader.js';
import contentReview from '../src/data/content-review.json';

let manifest;

beforeAll(async () => {
  manifest = await manifestLoader.loadManifest();
});

describe('ManifestLoader reviewed runtime catalog', () => {
  it('returns only categories that still have approved signs', async () => {
    const categories = await manifestLoader.getCategories();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
    categories.forEach(category => {
      expect(manifest.categories[category].signs.length).toBeGreaterThan(0);
    });
  });

  it('uses the review summary approved count as the runtime sign count', async () => {
    const total = await manifestLoader.getTotalSignCount();
    expect(total).toBe(contentReview.summary.approved);
  });

  it('does not expose held labels in category results', async () => {
    const colors = await manifestLoader.getCategorySigns('colors');
    const labels = colors.map(sign => sign.label);
    expect(labels).not.toContain('Where is...?');
    expect(labels).not.toContain('Color (Intro)');
  });

  it('returns canonical reviewed labels', async () => {
    const alphabet = await manifestLoader.getCategorySigns('alphabet');
    expect(alphabet[0].label).toBe('A');
    expect(alphabet[0].originalLabel).toBe('Alphabet: A');
  });

  it('returns null for a held sign ID', async () => {
    expect(await manifestLoader.getSignById('numbers_8_19')).toBeNull();
  });

  it('searches across reviewed labels and aliases', async () => {
    const results = await manifestLoader.searchSigns('mother');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(sign => sign.label === 'Mother')).toBe(true);
  });
});
