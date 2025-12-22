/**
 * Direct Manifest Generator - Uses CSV labels for proper naming
 * Generates signs-manifest.json with meaningful English labels
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, '../assets/all_extracted_signs');
const CSV_FILE = path.join(__dirname, 'asset-review-clean.csv');
const OUTPUT_JSON = path.join(__dirname, '../src/data/signs-manifest.json');

// Category mapping from pages (from asset-mapper.js)
function getCategoryFromPage(page) {
  if (page <= 8) return 'alphabet';
  if (page <= 11) return 'numbers';
  if (page <= 39) return 'people';
  if (page <= 54) return 'actions';
  if (page <= 75) return 'places';
  if (page <= 85) return 'time';
  if (page <= 102) return 'food';
  if (page <= 115) return 'animals';
  if (page <= 132) return 'colors';
  if (page <= 140) return 'nature';
  if (page <= 157) return 'objects';
  // Skip misc - return null for items beyond page 157
  return null;
}

console.log('📦 SignMaster Manifest Generator with Labels\n');

// Parse CSV to get labels
function parseCSV(csvPath) {
  const labelMap = new Map();
  
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️ CSV file not found, using default labels');
    return labelMap;
  }
  
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').slice(1); // Skip header
  
  lines.forEach(line => {
    if (!line.trim()) return;
    
    // Parse CSV with quotes handling
    const parts = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current.trim());
    
    // CSV columns: Filename, Page, Sequence, Category, OCR Text, Confidence, Suggested Label, Manual Label, Verified, Notes
    const [filename, , , category, , , , manualLabel, verified] = parts;
    
    if (filename && manualLabel) {
      labelMap.set(filename, {
        label: manualLabel,
        category: category || null,
        verified: verified?.toLowerCase() === 'yes'
      });
    }
  });
  
  console.log(`📋 Loaded ${labelMap.size} labels from CSV\n`);
  return labelMap;
}

// Load labels from CSV
const labelMap = parseCSV(CSV_FILE);

// Get all PNG files
const files = fs.readdirSync(ASSETS_DIR).filter(f => f.endsWith('.png'));
console.log(`📂 Found ${files.length} PNG files\n`);

const manifest = {
  version: '2.0.0',
  generatedAt: new Date().toISOString(),
  categories: {}
};

// Process each file
let skippedMisc = 0;
files.forEach(file => {
  const match = file.match(/^p(\d+)_(\d+)\.png$/);
  if (!match) return;
  
  const page = parseInt(match[1]);
  const sequence = parseInt(match[2]);
  
  // Get category - skip misc (null)
  let category = getCategoryFromPage(page);
  
  // Check if CSV has a category override
  const csvData = labelMap.get(file);
  if (csvData?.category) {
    category = csvData.category.toLowerCase();
  }
  
  // Skip misc category
  if (!category || category === 'misc') {
    skippedMisc++;
    return;
  }
  
  // Initialize category if needed
  if (!manifest.categories[category]) {
    manifest.categories[category] = {
      name: category.charAt(0).toUpperCase() + category.slice(1),
      signs: []
    };
  }
  
  // Get label from CSV or generate default
  let label = csvData?.label || `Sign ${page}-${sequence}`;
  let verified = csvData?.verified || false;
  
  // Clean up label
  label = label.replace(/^Sign:\s*/i, '').trim();
  
  // Create sign entry
  const sign = {
    id: `${category}_${page}_${sequence}`,
    label: label,
    filename: file,
    page: page,
    sequence: sequence,
    path: `/SignMaster/assets/all_extracted_signs/${file}`,
    verified: verified,
    description: `Learn to sign "${label}" in Uganda Sign Language`,
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
const totalSigns = Object.values(manifest.categories).reduce((sum, cat) => sum + cat.signs.length, 0);
const verifiedCount = Object.values(manifest.categories).reduce((sum, cat) => 
  sum + cat.signs.filter(s => s.verified).length, 0);

console.log('📊 Generation Statistics:\n');
console.log(`   Total signs: ${totalSigns}`);
console.log(`   Verified signs: ${verifiedCount}`);
console.log(`   Skipped (misc): ${skippedMisc}`);
console.log(`   Categories: ${Object.keys(manifest.categories).length}\n`);

console.log('📂 Signs per category:');
Object.entries(manifest.categories).forEach(([key, cat]) => {
  const verifiedInCat = cat.signs.filter(s => s.verified).length;
  console.log(`   ${cat.name.padEnd(12)} : ${cat.signs.length} signs (${verifiedInCat} verified)`);
});

console.log(`\n✅ Manifest generated: ${OUTPUT_JSON}`);
console.log('✨ All done!\n');
