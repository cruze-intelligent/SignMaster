/**
 * Asset Mapper - Hybrid AI-Powered OCR + Manual Verification Tool
 * 
 * This tool processes 1,020+ sign language PNG images using Tesseract.js OCR
 * to automatically categorize and label signs, then exports results to CSV
 * for manual verification before generating the final signs manifest.
 * 
 * Usage: npm run map-assets
 * 
 * Process:
 * 1. Scans assets/all_extracted_signs/ directory
 * 2. Runs OCR on each image with confidence scoring
 * 3. Auto-categorizes based on page number patterns
 * 4. Exports to tools/asset-review.csv for manual review
 * 5. After manual corrections, regenerates src/data/signs-manifest.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWorker } from 'tesseract.js';
import { createObjectCsvWriter } from 'csv-writer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, '../assets/all_extracted_signs');
const OUTPUT_CSV = path.join(__dirname, 'asset-review.csv');
const OUTPUT_JSON = path.join(__dirname, '../src/data/signs-manifest.json');

// Category mapping based on page patterns (analyzed from file structure)
const PAGE_CATEGORIES = {
  'alphabet': { pages: [2, 3, 4, 5, 6, 7], description: 'Alphabet letters A-Z' },
  'numbers': { pages: [8, 9, 10, 11, 12, 13, 14, 15], description: 'Numbers 0-20+' },
  'greetings': { pages: [16, 17, 18, 19, 20, 21], description: 'Common greetings and polite phrases' },
  'emotions': { pages: [22, 23, 24, 25], description: 'Emotional expressions' },
  'family': { pages: [26, 27, 28], description: 'Family members and relationships' },
  'school': { pages: [30, 31, 32, 33], description: 'School and education terms' },
  'food': { pages: [34, 35, 36, 37, 38, 39, 40], description: 'Food and drinks' },
  'colors': { pages: [41, 42, 43], description: 'Colors' },
  'animals': { pages: [44, 45, 46, 47, 48, 49], description: 'Animals' },
  'places': { pages: [50, 51, 52, 53], description: 'Places and locations' },
  'actions': { pages: [60, 64, 88, 101, 102], description: 'Action verbs' },
  'time': { pages: [147, 155, 156, 158, 166, 168], description: 'Time-related signs' }
};

function getCategoryFromPage(pageNum) {
  for (const [category, config] of Object.entries(PAGE_CATEGORIES)) {
    if (config.pages.includes(pageNum)) {
      return category;
    }
  }
  return 'uncategorized';
}

function parseFilename(filename) {
  // Parse format: p{PAGE}_{SEQUENCE}.png
  const match = filename.match(/p(\d+)_(\d+)\.png/);
  if (match) {
    return {
      page: parseInt(match[1]),
      sequence: parseInt(match[2]),
      filename: filename
    };
  }
  return null;
}

async function extractTextFromImage(imagePath, worker) {
  try {
    const { data: { text, confidence } } = await worker.recognize(imagePath);
    const cleanText = text.trim().replace(/\n/g, ' ').substring(0, 100);
    return {
      text: cleanText,
      confidence: Math.round(confidence)
    };
  } catch (error) {
    console.error(`Error processing ${imagePath}:`, error.message);
    return { text: '', confidence: 0 };
  }
}

function generateLabel(ocrText, category, sequence) {
  // Generate intelligent label based on OCR and category
  const cleaned = ocrText.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  
  if (cleaned.length > 0 && cleaned.length < 30) {
    return cleaned;
  }
  
  // Fallback to category-based naming
  return `${category}_${sequence}`;
}

async function processAssets() {
  console.log('🚀 SignMaster Asset Mapper - Starting...\n');
  console.log('📁 Scanning assets directory...');
  
  const files = fs.readdirSync(ASSETS_DIR)
    .filter(f => f.endsWith('.png'))
    .sort();
  
  console.log(`✅ Found ${files.length} PNG files\n`);
  console.log('🤖 Initializing Tesseract OCR worker...');
  
  const worker = await createWorker('eng');
  await worker.setParameters({
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ',
  });
  
  console.log('✅ OCR worker ready\n');
  console.log('🔍 Processing images (this may take 15-20 minutes)...\n');
  
  const results = [];
  let processed = 0;
  
  for (const file of files) {
    const parsed = parseFilename(file);
    if (!parsed) continue;
    
    const imagePath = path.join(ASSETS_DIR, file);
    const category = getCategoryFromPage(parsed.page);
    
    // Run OCR
    const { text, confidence } = await extractTextFromImage(imagePath, worker);
    const label = generateLabel(text, category, parsed.sequence);
    
    results.push({
      filename: file,
      page: parsed.page,
      sequence: parsed.sequence,
      category: category,
      ocrText: text,
      confidence: confidence,
      suggestedLabel: label,
      manualLabel: '', // To be filled during manual review
      verified: 'no',
      notes: ''
    });
    
    processed++;
    if (processed % 50 === 0) {
      console.log(`   Progress: ${processed}/${files.length} (${Math.round(processed/files.length*100)}%)`);
    }
  }
  
  await worker.terminate();
  console.log(`\n✅ OCR processing complete! Processed ${processed} images\n`);
  
  // Export to CSV
  console.log('📝 Exporting results to CSV...');
  
  const csvWriter = createObjectCsvWriter({
    path: OUTPUT_CSV,
    header: [
      { id: 'filename', title: 'Filename' },
      { id: 'page', title: 'Page' },
      { id: 'sequence', title: 'Sequence' },
      { id: 'category', title: 'Category' },
      { id: 'ocrText', title: 'OCR Text' },
      { id: 'confidence', title: 'Confidence (%)' },
      { id: 'suggestedLabel', title: 'Suggested Label' },
      { id: 'manualLabel', title: 'Manual Label (EDIT THIS)' },
      { id: 'verified', title: 'Verified (yes/no)' },
      { id: 'notes', title: 'Notes' }
    ]
  });
  
  await csvWriter.writeRecords(results);
  
  console.log(`✅ CSV exported to: ${OUTPUT_CSV}\n`);
  
  // Generate statistics
  const stats = {
    total: results.length,
    byCategory: {},
    lowConfidence: results.filter(r => r.confidence < 70).length,
    needsReview: results.filter(r => r.confidence < 70).length
  };
  
  results.forEach(r => {
    stats.byCategory[r.category] = (stats.byCategory[r.category] || 0) + 1;
  });
  
  console.log('📊 Statistics:');
  console.log(`   Total images: ${stats.total}`);
  console.log(`   Low confidence (<70%): ${stats.lowConfidence}`);
  console.log(`   Needs manual review: ${stats.needsReview}`);
  console.log('\n📂 By Category:');
  Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`   ${cat.padEnd(15)} ${count}`);
    });
  
  console.log('\n📋 Next Steps:');
  console.log('   1. Open tools/asset-review.csv in Excel/Google Sheets');
  console.log('   2. Review rows where Confidence < 70%');
  console.log('   3. Fill "Manual Label" column with correct labels');
  console.log('   4. Set "Verified" to "yes" for reviewed items');
  console.log('   5. Save the CSV');
  console.log('   6. Run: node tools/generate-manifest.js');
  console.log('\n✨ Asset mapping complete!\n');
}

// Auto-run when called directly
processAssets().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

export { processAssets, getCategoryFromPage, parseFilename };
