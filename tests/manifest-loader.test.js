/**
 * ManifestLoader Unit Tests
 * Tests the manifest data access layer without DOM dependencies.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load manifest directly (matches how ManifestLoader uses it)
const manifest = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../src/data/signs-manifest.json'), 'utf-8')
);

// Simulate ManifestLoader's core methods
function getCategories() {
    return Object.keys(manifest.categories);
}

function getCategorySigns(category) {
    return manifest.categories[category]?.signs || [];
}

function getSignById(id) {
    for (const cat of Object.values(manifest.categories)) {
        const sign = cat.signs.find(s => s.id === id);
        if (sign) return sign;
    }
    return null;
}

function searchSigns(query) {
    const q = query.toLowerCase();
    const results = [];
    for (const cat of Object.values(manifest.categories)) {
        for (const sign of cat.signs) {
            if (sign.label.toLowerCase().includes(q)) {
                results.push(sign);
            }
        }
    }
    return results;
}

function getTotalSignCount() {
    return Object.values(manifest.categories).reduce(
        (sum, cat) => sum + cat.signs.length, 0
    );
}

describe('getCategories()', () => {
    it('returns an array of category keys', () => {
        const cats = getCategories();
        expect(Array.isArray(cats)).toBe(true);
        expect(cats.length).toBeGreaterThanOrEqual(10);
        expect(cats).not.toContain('social');
    });

    it('includes "alphabet" and "numbers"', () => {
        const cats = getCategories();
        expect(cats).toContain('alphabet');
        expect(cats).toContain('numbers');
    });
});

describe('getCategorySigns()', () => {
    it('returns signs for a valid category', () => {
        const signs = getCategorySigns('alphabet');
        expect(signs.length).toBeGreaterThan(0);
        expect(signs[0]).toHaveProperty('id');
        expect(signs[0]).toHaveProperty('label');
    });

    it('returns empty array for unknown category', () => {
        const signs = getCategorySigns('nonexistent_category');
        expect(signs).toEqual([]);
    });
});

describe('getSignById()', () => {
    it('finds a sign by its ID', () => {
        const alphabetSigns = getCategorySigns('alphabet');
        const first = alphabetSigns[0];
        const found = getSignById(first.id);
        expect(found).toBeDefined();
        expect(found.id).toBe(first.id);
    });

    it('returns null for unknown ID', () => {
        expect(getSignById('totally_fake_id_xyz')).toBeNull();
    });
});

describe('searchSigns()', () => {
    it('finds signs matching a query', () => {
        // Search for something likely in alphabet category
        const results = searchSigns('a');
        expect(results.length).toBeGreaterThan(0);
    });

    it('returns empty for gibberish query', () => {
        const results = searchSigns('zzzzxyznonexistent');
        expect(results).toHaveLength(0);
    });

    it('is case-insensitive', () => {
        const lower = searchSigns('hello');
        const upper = searchSigns('HELLO');
        expect(lower.length).toBe(upper.length);
    });
});

describe('getTotalSignCount()', () => {
    it('returns the total number of signs', () => {
        const total = getTotalSignCount();
        expect(total).toBeGreaterThanOrEqual(570);
    });

    it('matches sum of all category counts', () => {
        const total = getTotalSignCount();
        let sum = 0;
        for (const cat of getCategories()) {
            sum += getCategorySigns(cat).length;
        }
        expect(total).toBe(sum);
    });
});
