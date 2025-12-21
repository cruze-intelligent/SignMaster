/**
 * Direct Manifest Generator - bypasses CSV issues
 * Generates signs-manifest.json directly from the PNG files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, '../assets/all_extracted_signs');
const OUTPUT_JSON = path.join(__dirname, '../src/data/signs-manifest.json');

// Category mapping from pages (from asset-mapper.js)
function getCategoryFromPage(page) {
  if (page <= 8) return 'alphabet';
  if (page <= 10) return 'numbers';
  if (page <= 39) return 'people';
  if (page <= 54) return 'actions';
  if (page <= 75) return 'places';
  if (page <= 85) return 'time';
  if (page <= 102) return 'food';
  if (page <= 115) return 'animals';
  if (page <= 132) return 'colors';
  if (page <= 140) return 'nature';
  if (page <= 157) return 'objects';
  return 'misc';
}

console.log('📦 SignMaster Direct Manifest Generator\n');

// Get all PNG files
const files = fs.readdirSync(ASSETS_DIR).filter(f => f.endsWith('.png'));
console.log(`📂 Found ${files.length} PNG files\n`);

const manifest = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  categories: {}
};

// Process each file
files.forEach(file => {
  const match = file.match(/^p(\d+)_(\d+)\.png$/);
  if (!match) return;
  
  const page = parseInt(match[1]);
  const sequence = parseInt(match[2]);
  const category = getCategoryFromPage(page);
  
  // Initialize category if needed
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
    filename: file,
    page: page,
    sequence: sequence,
    path: `/SignMaster/assets/all_extracted_signs/${file}`,
    verified: false,
    description: `Sign from page ${page}, sequence ${sequence}`,
    difficulty: category === 'alphabet' || category === 'numbers' ? 'beginner' : 'intermediate'
  };
  
  manifest.categories[category].signs.push(sign);
});

// Sort signs within each category
Object.values(manifest.categories).forEach(cat => {
  cat.signs.sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    return a.sequence - b.sequence;
  });
});

// Write manifest
fs.writeFileSync(OUTPUT_JSON, JSON.stringify(manifest, null, 2));

// Generate statistics
console.log('📊 Generation Statistics:\n');
console.log(`   Total signs: ${files.length}`);
console.log(`   Categories: ${Object.keys(manifest.categories).length}\n`);

console.log('📂 Signs per category:');
Object.entries(manifest.categories).forEach(([key, cat]) => {
  console.log(`   ${cat.name.padEnd(12)} : ${cat.signs.length} signs`);
});

console.log(`\n✅ Manifest generated: ${OUTPUT_JSON}`);
console.log('✨ All done!\n');
