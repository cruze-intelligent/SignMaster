import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_PATH = path.join(__dirname, '../src/data/signs-manifest.json');
const REVIEW_PATH = path.join(__dirname, '../src/data/content-review.json');
const INDEX_PATH = path.join(__dirname, '../index.html');
const README_PATH = path.join(__dirname, '../README.md');
const ASSETS_DIR = path.join(__dirname, '../public/assets/all_extracted_signs');

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const review = JSON.parse(fs.readFileSync(REVIEW_PATH, 'utf8'));
const indexHtml = fs.readFileSync(INDEX_PATH, 'utf8');
const readme = fs.readFileSync(README_PATH, 'utf8');

const allSigns = Object.entries(manifest.categories).flatMap(([category, data]) =>
  data.signs.map(sign => ({ ...sign, _category: category }))
);

describe('Manifest Structure', () => {
  it('has a valid version string', () => {
    expect(typeof manifest.version).toBe('string');
  });

  it('every category has a name and signs array', () => {
    for (const [key, category] of Object.entries(manifest.categories)) {
      expect(category.name, `Category "${key}" missing name`).toBeDefined();
      expect(Array.isArray(category.signs), `Category "${key}" signs is not an array`).toBe(true);
      expect(category.signs.length, `Category "${key}" is empty`).toBeGreaterThan(0);
    }
  });

  it('every filename references an image that exists on disk', () => {
    const diskFiles = new Set(fs.readdirSync(ASSETS_DIR));
    const missing = allSigns.filter(sign => !diskFiles.has(sign.filename)).map(sign => sign.filename);
    expect(missing, `Missing files: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('has no duplicate IDs or filenames', () => {
    const ids = allSigns.map(sign => sign.id);
    const filenames = allSigns.map(sign => sign.filename);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(filenames).size).toBe(filenames.length);
  });
});

describe('Content Review Ledger', () => {
  const reviewIds = review.records.map(record => record.id);
  const allowedStatuses = new Set(['approved', 'hold', 'rejected']);

  it('has one review row per manifest sign', () => {
    expect(review.records).toHaveLength(allSigns.length);
    expect(new Set(reviewIds).size).toBe(reviewIds.length);
  });

  it('only uses allowed statuses', () => {
    review.records.forEach(record => {
      expect(allowedStatuses.has(record.status), `Unexpected status for ${record.id}`).toBe(true);
    });
  });

  it('includes both approved and held content in the initial seed', () => {
    expect(review.summary.approved).toBeGreaterThan(0);
    expect(review.summary.hold).toBeGreaterThan(0);
  });

  it('flags known risky labels as hold', () => {
    const holdLabels = new Set(
      review.records.filter(record => record.status === 'hold').map(record => record.originalLabel)
    );
    expect(holdLabels.has('Where is...?')).toBe(true);
    expect(holdLabels.has('Number: One (Variation)')).toBe(true);
    expect(holdLabels.has('Location/Place (Intro)')).toBe(true);
  });
});

describe('Copy Hygiene', () => {
  it('removes stale marketing claims from index.html', () => {
    expect(indexHtml).not.toMatch(/1,020\+/);
    expect(indexHtml).not.toMatch(/real signs/i);
    expect(indexHtml).not.toMatch(/translate\.googleapis\.com/);
  });

  it('removes stale verified-count claims from README', () => {
    expect(readme).not.toMatch(/676 verified signs/i);
  });
});
