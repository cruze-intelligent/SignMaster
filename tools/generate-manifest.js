/**
 * Manifest Generator - Converts reviewed CSV to production signs manifest
 * 
 * This tool reads the manually verified asset-review.csv and generates
 * the final signs-manifest.json for production use.
 * 
 * Usage: node tools/generate-manifest.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_CSV = path.join(__dirname, 'asset-review-clean.csv');
const OUTPUT_JSON = path.join(__dirname, '../src/data/signs-manifest.json');

async function generateManifest() {
  console.log('📦 SignMaster Manifest Generator - Starting...\n');
  
  if (!fs.existsSync(INPUT_CSV)) {
    console.error('❌ Error: asset-review.csv not found!');
    console.log('   Run "npm run map-assets" first to generate the CSV.\n');
    process.exit(1);
  }
  
  console.log('📖 Reading CSV file...');
  const csvContent = fs.readFileSync(INPUT_CSV, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true
  });
  
  console.log(`✅ Loaded ${records.length} records\n`);
  
  // Group by category
  const manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    categories: {}
  };
  
  let verified = 0;
  let unverified = 0;
  
  records.forEach(record => {
    const filename = record['Filename'] || record.filename;
    const category = record['Category'] || record.category || 'uncategorized';
    const label = record['Manual Label'] || record.manualLabel || record['Suggested Label'] || record.suggestedLabel || 'unknown';
    const isVerified = (record['Verified (yes/no)'] || record.verified || '').toLowerCase() === 'yes';
    
    // Skip if essential fields are missing
    if (!filename || !category || !label || label === 'unknown') {
      // Only warn if we have at least one valid field (to avoid spamming for completely empty rows)
      if (filename || category || label) {
        console.warn(`⚠️  Skipping invalid record: ${filename || 'unknown'} (missing: ${!filename ? 'filename ' : ''}${!category ? 'category ' : ''}${!label || label === 'unknown' ? 'label' : ''})`);
      }
      return;
    }
    
    if (isVerified) verified++;
    else unverified++;
    
    if (!manifest.categories[category]) {
      manifest.categories[category] = {
        name: category.charAt(0).toUpperCase() + category.slice(1),
        signs: []
      };
    }
    
    const sign = {
      id: label.toLowerCase().replace(/\s+/g, '_'),
      label: label,
      filename: filename,
      page: parseInt(record['Page'] || record.page),
      sequence: parseInt(record['Sequence'] || record.sequence),
      path: `/SignMaster/assets/all_extracted_signs/${filename}`,
      verified: isVerified,
      description: `The sign for ${label}`,
      difficulty: category === 'alphabet' ? 'beginner' : category === 'numbers' ? 'beginner' : 'intermediate'
    };
    
    manifest.categories[category].signs.push(sign);
  });
  
  // Sort signs within each category by sequence
  Object.values(manifest.categories).forEach(cat => {
    cat.signs.sort((a, b) => a.sequence - b.sequence);
  });
  
  // Write manifest
  console.log('💾 Writing manifest file...');
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(manifest, null, 2));
  
  console.log(`✅ Manifest generated: ${OUTPUT_JSON}\n`);
  console.log('📊 Statistics:');
  console.log(`   Total signs: ${records.length}`);
  console.log(`   Verified: ${verified} (${Math.round(verified/records.length*100)}%)`);
  console.log(`   Unverified: ${unverified} (${Math.round(unverified/records.length*100)}%)`);
  console.log(`   Categories: ${Object.keys(manifest.categories).length}`);
  console.log('\n📂 Signs per category:');
  Object.entries(manifest.categories)
    .sort((a, b) => b[1].signs.length - a[1].signs.length)
    .forEach(([cat, data]) => {
      console.log(`   ${cat.padEnd(15)} ${data.signs.length} signs`);
    });
  
  console.log('\n✨ Manifest generation complete!\n');
}

generateManifest().catch(console.error);
