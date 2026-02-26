/**
 * Recover Orphaned Images — Finds images on disk NOT in the manifest
 * and merges them in using page-based category heuristics.
 *
 * Usage: node tools/recover-orphans.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_PATH = path.join(__dirname, '../src/data/signs-manifest.json');
const ASSETS_DIR = path.join(__dirname, '../public/assets/all_extracted_signs');
// Fallback: check root assets dir if public one doesn't exist
const ASSETS_DIR_FALLBACK = path.join(__dirname, '../assets/all_extracted_signs');

// Known non-sign files (tables, forms, admin content) — DO NOT add to manifest
const NON_SIGN_FILES = new Set([
    'p34_0006.png',   // Time vocabulary table
    'p34_0007.png',   // Time Sequence table
    'p38_0008.png',   // Grammar: Past Tense table
    'p38_0009.png',   // Negation reference
    'p39_0010.png',   // Action Practice page
    'p39_0011.png',   // Grammar: Sentence Examples
    'p40_0012.png',   // Sentence translation example
    'p64_0023.png',   // Nursery Rhyme text
    'p88_0024.png',   // Teaching Methodology Checklist
    'p54_0022.png',   // Training Materials Checklist
    'p51_0019.png',   // Training Methodology: Q&A
]);

/**
 * Page-to-category mapping based on USL textbook structure.
 * Derived from generate-manifest-direct.js and cleanup-manifest.py.
 */
function getCategoryFromPage(page) {
    if (page <= 3) return 'alphabet';
    if (page <= 6) return 'greetings';
    if (page <= 7) return 'family';
    if (page <= 8) return 'numbers';
    if (page <= 9) return 'numbers';
    if (page <= 11) return 'numbers';
    if (page <= 13) return 'emotions';
    if (page <= 15) return 'school';
    if (page <= 17) return 'food';
    if (page <= 18) return 'food';
    if (page <= 20) return 'colors';
    if (page <= 21) return 'animals';
    if (page <= 23) return 'places';
    if (page <= 25) return 'places';
    if (page <= 28) return 'actions';
    if (page <= 31) return 'actions';
    if (page <= 34) return 'actions';
    if (page <= 37) return 'actions';
    if (page <= 39) return 'actions';
    if (page <= 42) return 'actions';
    if (page <= 43) return 'actions';
    if (page <= 45) return 'actions';
    if (page <= 47) return 'actions';
    if (page <= 48) return 'time';
    if (page <= 49) return 'time';
    if (page <= 51) return 'social';
    if (page <= 53) return 'social';
    if (page <= 54) return 'social';
    if (page <= 60) return 'social';
    // Higher pages: reference/misc content
    if (page <= 102) return 'food';
    if (page <= 115) return 'animals';
    if (page <= 132) return 'colors';
    if (page <= 140) return 'greetings';
    if (page <= 157) return 'social';
    if (page <= 168) return 'social';
    return null; // skip truly unknown pages
}

/**
 * Try to infer a better category by looking at what category other signs
 * from the same page are already assigned to in the manifest.
 */
function inferCategoryFromManifest(page, manifestCategories) {
    for (const [catKey, catData] of Object.entries(manifestCategories)) {
        const hasPageMatch = catData.signs.some(s => s.page === page);
        if (hasPageMatch) return catKey;
    }
    return null;
}

// ============================================================
// MAIN
// ============================================================

console.log('🔍 SignMaster Orphan Recovery Tool\n');

// Load manifest
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));

// Collect all filenames already in manifest
const manifestFiles = new Set();
for (const cat of Object.values(manifest.categories)) {
    for (const sign of cat.signs) {
        manifestFiles.add(sign.filename);
    }
}
console.log(`📋 Current manifest: ${manifestFiles.size} signs`);

// Find all PNGs on disk
const assetsDir = fs.existsSync(ASSETS_DIR) ? ASSETS_DIR : ASSETS_DIR_FALLBACK;
const diskFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.png')).sort();
console.log(`📂 Images on disk: ${diskFiles.length}`);

// Identify orphans
const orphans = diskFiles.filter(f => !manifestFiles.has(f));
console.log(`🔎 Orphaned images: ${orphans.length}\n`);

if (orphans.length === 0) {
    console.log('✅ No orphans found — manifest is complete!');
    process.exit(0);
}

// Process orphans
let added = 0;
let skippedNonSign = 0;
let skippedUnknown = 0;

for (const filename of orphans) {
    // Skip known non-sign files
    if (NON_SIGN_FILES.has(filename)) {
        skippedNonSign++;
        console.log(`   ⏭️  Skipping non-sign: ${filename}`);
        continue;
    }

    const match = filename.match(/^p(\d+)_(\d+)\.png$/);
    if (!match) {
        skippedUnknown++;
        console.log(`   ⏭️  Skipping unknown format: ${filename}`);
        continue;
    }

    const page = parseInt(match[1]);
    const sequence = parseInt(match[2]);

    // Try manifest-based inference first, then fall back to page heuristics
    let category = inferCategoryFromManifest(page, manifest.categories);
    if (!category) {
        category = getCategoryFromPage(page);
    }

    if (!category) {
        skippedUnknown++;
        console.log(`   ⏭️  No category for page ${page}: ${filename}`);
        continue;
    }

    // Ensure category exists
    if (!manifest.categories[category]) {
        manifest.categories[category] = {
            name: category.charAt(0).toUpperCase() + category.slice(1),
            signs: []
        };
    }

    // Create sign entry
    const sign = {
        id: `${category}_${page}_${sequence}`,
        label: `Sign ${page}-${sequence}`,
        filename: filename,
        page: page,
        sequence: sequence,
        path: `/SignMaster/assets/all_extracted_signs/${filename}`,
        verified: false,
        description: `Learn to sign "Sign ${page}-${sequence}" in Uganda Sign Language`,
        difficulty: (category === 'alphabet' || category === 'numbers') ? 'beginner' : 'intermediate'
    };

    manifest.categories[category].signs.push(sign);
    added++;
}

// Sort signs within each category
for (const cat of Object.values(manifest.categories)) {
    cat.signs.sort((a, b) => {
        if (a.page !== b.page) return a.page - b.page;
        return a.sequence - b.sequence;
    });
}

// Deduplicate: check for duplicate IDs and filenames
const allIds = new Set();
const allFilenames = new Set();
let dupeCount = 0;

for (const [catKey, cat] of Object.entries(manifest.categories)) {
    const cleanSigns = [];
    for (const sign of cat.signs) {
        if (allIds.has(sign.id) || allFilenames.has(sign.filename)) {
            dupeCount++;
            console.log(`   🔄 Removing duplicate: ${sign.filename} (${sign.id})`);
            continue;
        }
        allIds.add(sign.id);
        allFilenames.add(sign.filename);
        cleanSigns.push(sign);
    }
    cat.signs = cleanSigns;
}

// Remove empty categories
for (const key of Object.keys(manifest.categories)) {
    if (manifest.categories[key].signs.length === 0) {
        delete manifest.categories[key];
    }
}

// Update manifest metadata
manifest.version = '2.2.0';
manifest.recoveredAt = new Date().toISOString();

// Write updated manifest
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

// Final report
const totalSigns = Object.values(manifest.categories).reduce(
    (sum, cat) => sum + cat.signs.length, 0
);

console.log('\n' + '='.repeat(50));
console.log('📊 Recovery Report\n');
console.log(`   Added:          ${added}`);
console.log(`   Skipped (non-sign): ${skippedNonSign}`);
console.log(`   Skipped (unknown):  ${skippedUnknown}`);
console.log(`   Duplicates removed: ${dupeCount}`);
console.log(`   Total in manifest:  ${totalSigns}`);
console.log(`   Disk coverage:      ${(totalSigns / diskFiles.length * 100).toFixed(1)}%`);

console.log('\n📂 Signs per category:');
for (const [key, cat] of Object.entries(manifest.categories)) {
    const verified = cat.signs.filter(s => s.verified).length;
    console.log(`   ${cat.name.padEnd(12)} : ${String(cat.signs.length).padStart(4)} signs (${verified} verified)`);
}

console.log(`\n✅ Manifest updated: ${MANIFEST_PATH}`);
console.log('✨ Done!\n');
