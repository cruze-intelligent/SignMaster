/**
 * Manifest Integrity Tests
 * Validates that signs-manifest.json is consistent and all referenced images exist.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_PATH = path.join(__dirname, '../src/data/signs-manifest.json');
const ASSETS_DIR = path.join(__dirname, '../public/assets/all_extracted_signs');

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));

describe('Manifest Structure', () => {
    it('has a valid version string', () => {
        expect(manifest.version).toBeDefined();
        expect(typeof manifest.version).toBe('string');
    });

    it('has at least one category', () => {
        const categories = Object.keys(manifest.categories);
        expect(categories.length).toBeGreaterThan(0);
    });

    it('every category has a name and signs array', () => {
        for (const [key, cat] of Object.entries(manifest.categories)) {
            expect(cat.name, `Category "${key}" missing name`).toBeDefined();
            expect(Array.isArray(cat.signs), `Category "${key}" signs is not an array`).toBe(true);
            expect(cat.signs.length, `Category "${key}" is empty`).toBeGreaterThan(0);
        }
    });
});

describe('Sign Entries', () => {
    const allSigns = [];
    for (const [catKey, cat] of Object.entries(manifest.categories)) {
        for (const sign of cat.signs) {
            allSigns.push({ ...sign, _category: catKey });
        }
    }

    it('has at least 570 signs total', () => {
        expect(allSigns.length).toBeGreaterThanOrEqual(570);
    });

    it('every sign has required fields', () => {
        for (const sign of allSigns) {
            expect(sign.id, `Missing id in ${sign._category}`).toBeDefined();
            expect(sign.label, `Missing label for ${sign.id}`).toBeDefined();
            expect(sign.filename, `Missing filename for ${sign.id}`).toBeDefined();
            expect(sign.path, `Missing path for ${sign.id}`).toBeDefined();
            expect(typeof sign.verified, `Missing verified for ${sign.id}`).toBe('boolean');
        }
    });

    it('has no duplicate filenames across all categories', () => {
        const filenames = allSigns.map(s => s.filename);
        const dupes = filenames.filter((f, i) => filenames.indexOf(f) !== i);
        expect(dupes, `Duplicate filenames: ${dupes.join(', ')}`).toHaveLength(0);
    });

    it('has no duplicate IDs across all categories', () => {
        const ids = allSigns.map(s => s.id);
        const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
        expect(dupes, `Duplicate IDs: ${dupes.join(', ')}`).toHaveLength(0);
    });

    it('every filename references an image that exists on disk', () => {
        const diskFiles = new Set(fs.readdirSync(ASSETS_DIR));
        const missing = allSigns
            .filter(s => !diskFiles.has(s.filename))
            .map(s => s.filename);
        expect(missing, `Missing files: ${missing.join(', ')}`).toHaveLength(0);
    });

    it('disk coverage accounts for cleaned entries', () => {
        const diskCount = fs.readdirSync(ASSETS_DIR).filter(f => f.endsWith('.png')).length;
        // After cleanup, coverage may be lower since unverified images stay on disk
        expect(allSigns.length).toBeGreaterThan(0);
        expect(allSigns.length).toBeLessThanOrEqual(diskCount);
    });

    it('has no generic "Sign X-Y" labels', () => {
        const generic = allSigns.filter(s => /^Sign \d+-\d+$/.test(s.label));
        expect(generic, `Generic labels found: ${generic.map(s => s.label).join(', ')}`).toHaveLength(0);
    });

    it('all entries are verified', () => {
        const unverified = allSigns.filter(s => !s.verified);
        expect(unverified, `Unverified: ${unverified.map(s => s.id).join(', ')}`).toHaveLength(0);
    });

    it('has no known-bad label patterns', () => {
        const badPatterns = [/\breview\b/i, /\blesson\b/i, /\bgrammar\b/i, /\bmethodology\b/i,
            /\bchecklist\b/i, /\bstatistics\b/i, /\battendance\b/i, /\bnursery rhyme\b/i];
        const bad = allSigns.filter(s => badPatterns.some(p => p.test(s.label)));
        expect(bad, `Bad labels: ${bad.map(s => s.label).join(', ')}`).toHaveLength(0);
    });
});

describe('Category Quality', () => {
    const expectedCategories = [
        'alphabet', 'numbers', 'greetings', 'family', 'emotions',
        'school', 'food', 'colors', 'animals', 'places', 'actions',
        'time'
    ];

    it('includes all expected categories', () => {
        const keys = Object.keys(manifest.categories);
        for (const cat of expectedCategories) {
            expect(keys, `Missing category: ${cat}`).toContain(cat);
        }
    });

    it('alphabet has at least 23 signs', () => {
        expect(manifest.categories.alphabet.signs.length).toBeGreaterThanOrEqual(23);
    });

    it('numbers has at least 100 signs', () => {
        expect(manifest.categories.numbers.signs.length).toBeGreaterThanOrEqual(100);
    });
});
