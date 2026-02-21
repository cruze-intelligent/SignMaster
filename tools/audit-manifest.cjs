#!/usr/bin/env node
/**
 * audit-manifest.js — Audit and clean the signs manifest
 *
 * Usage:
 *   node tools/audit-manifest.js              # Print audit report only
 *   node tools/audit-manifest.js --clean      # Write cleaned manifest in-place
 */

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.join(__dirname, '../src/data/signs-manifest.json');
const ASSETS_DIR = path.join(__dirname, '../public/assets/all_extracted_signs');

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));

// ── Pattern-based removal rules ──────────────────────────────────────────────
const BAD_LABEL_PATTERNS = [
    /\breview\b/i,
    /\blesson\b/i,
    /\bpractice\b/i,
    /\bgrammar\b/i,
    /\bmethodology\b/i,
    /\bchecklist\b/i,
    /\bstatistics\b/i,
    /\battendance\b/i,
    /\benrollment\b/i,
    /\bmetrics\b/i,
    /\bactivity report\b/i,
    /\bnursery rhyme\b/i,
    /\bcompound word\b/i,
    /\bsentence example\b/i,
    /\btraining\b/i,
    /\bevaluation\b/i,
];

const GENERIC_LABEL = /^Sign \d+-\d+$/;

// Categories to drop entirely
const DROP_CATEGORIES = ['social'];

// ── Audit function ───────────────────────────────────────────────────────────
function auditManifest() {
    const diskFiles = new Set(fs.readdirSync(ASSETS_DIR));
    const report = { categories: {}, summary: {} };
    let totalKept = 0;
    let totalRemoved = 0;

    for (const [catKey, catData] of Object.entries(manifest.categories)) {
        const signs = catData.signs;
        const kept = [];
        const removed = [];

        if (DROP_CATEGORIES.includes(catKey)) {
            removed.push(...signs.map(s => ({ ...s, reason: 'category-dropped' })));
        } else {
            for (const sign of signs) {
                let reason = null;

                // Rule 1: Must be verified
                if (!sign.verified) {
                    reason = 'unverified';
                }

                // Rule 2: Generic label
                if (!reason && GENERIC_LABEL.test(sign.label)) {
                    reason = 'generic-label';
                }

                // Rule 3: Bad label pattern
                if (!reason) {
                    for (const pattern of BAD_LABEL_PATTERNS) {
                        if (pattern.test(sign.label)) {
                            reason = `bad-pattern: ${pattern}`;
                            break;
                        }
                    }
                }

                // Rule 4: File must exist on disk
                if (!reason && !diskFiles.has(sign.filename)) {
                    reason = 'missing-file';
                }

                if (reason) {
                    removed.push({ ...sign, reason });
                } else {
                    kept.push(sign);
                }
            }
        }

        report.categories[catKey] = {
            original: signs.length,
            kept: kept.length,
            removed: removed.length,
            removedEntries: removed,
            keptEntries: kept,
        };

        totalKept += kept.length;
        totalRemoved += removed.length;
    }

    report.summary = {
        totalOriginal: totalKept + totalRemoved,
        totalKept,
        totalRemoved,
        categoriesDropped: DROP_CATEGORIES,
        categoriesRemaining: Object.keys(manifest.categories).filter(
            c => !DROP_CATEGORIES.includes(c) && report.categories[c].kept > 0
        ),
    };

    return report;
}

// ── Print report ─────────────────────────────────────────────────────────────
function printReport(report) {
    console.log('\n═══════════════════════════════════════════');
    console.log('  SignMaster Manifest Audit Report');
    console.log('═══════════════════════════════════════════\n');

    for (const [cat, data] of Object.entries(report.categories)) {
        const dropped = DROP_CATEGORIES.includes(cat) ? ' [DROPPED]' : '';
        console.log(`📁 ${cat}${dropped}: ${data.original} → ${data.kept} (removed ${data.removed})`);
        if (data.removedEntries.length > 0 && data.removedEntries.length <= 20) {
            for (const entry of data.removedEntries) {
                console.log(`   ❌ "${entry.label}" (${entry.filename}) — ${entry.reason}`);
            }
        } else if (data.removedEntries.length > 20) {
            const reasons = {};
            for (const e of data.removedEntries) {
                reasons[e.reason] = (reasons[e.reason] || 0) + 1;
            }
            for (const [r, c] of Object.entries(reasons)) {
                console.log(`   ❌ ${c}x ${r}`);
            }
        }
    }

    console.log('\n───────────────────────────────────────────');
    console.log(`Total: ${report.summary.totalOriginal} → ${report.summary.totalKept} signs`);
    console.log(`Removed: ${report.summary.totalRemoved}`);
    console.log(`Categories remaining: ${report.summary.categoriesRemaining.join(', ')}`);
    console.log(`Categories dropped: ${report.summary.categoriesDropped.join(', ') || 'none'}`);
    console.log('───────────────────────────────────────────\n');
}

// ── Clean and write ──────────────────────────────────────────────────────────
function cleanManifest(report) {
    const cleaned = {
        version: '3.0.0',
        generatedAt: manifest.generatedAt,
        cleanedAt: new Date().toISOString(),
        categories: {},
    };

    for (const catKey of report.summary.categoriesRemaining) {
        const originalCat = manifest.categories[catKey];
        cleaned.categories[catKey] = {
            name: originalCat.name,
            signs: report.categories[catKey].keptEntries,
        };
    }

    return cleaned;
}

// ── Main ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const shouldClean = args.includes('--clean');

const report = auditManifest();
printReport(report);

if (shouldClean) {
    const cleaned = cleanManifest(report);
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(cleaned, null, 2) + '\n');
    console.log(`✅ Cleaned manifest written to ${MANIFEST_PATH}`);
    console.log(`   ${Object.keys(cleaned.categories).length} categories, ` +
        `${Object.values(cleaned.categories).reduce((s, c) => s + c.signs.length, 0)} signs`);
} else {
    console.log('ℹ️  Run with --clean to write the cleaned manifest in-place.');
}
