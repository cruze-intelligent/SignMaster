/**
 * Fix the malformed CSV by removing extra quotes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_CSV = path.join(__dirname, 'asset-review.csv');
const OUTPUT_CSV = path.join(__dirname, 'asset-review-clean.csv');

console.log('🔧 Fixing CSV format...\n');

const content = fs.readFileSync(INPUT_CSV, 'utf-8');

// Remove the quotes wrapping each line
const fixed = content
  .split('\n')
  .map(line => line.replace(/^"|"$/g, ''))  // Remove leading/trailing quotes from each line
  .join('\n');

fs.writeFileSync(OUTPUT_CSV, fixed);

console.log(`✅ Fixed CSV saved to: ${OUTPUT_CSV}\n`);

// Verify by reading first few lines
const lines = fixed.split('\n').slice(0, 5);
lines.forEach((line, i) => {
  console.log(`Line ${i + 1}: ${line.substring(0, 100)}...`);
});
