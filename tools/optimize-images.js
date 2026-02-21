/**
 * Image Optimization Script
 * Optimizes PNG images and converts to WebP for better performance
 * Uses sharp for high-quality image processing
 * 
 * Run: npm install sharp --save-dev
 * Then: node tools/optimize-images.js
 */

import { readdir, stat } from 'fs/promises';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SOURCE_DIR = join(__dirname, '..', 'public', 'assets', 'all_extracted_signs');
const OUTPUT_DIR = join(__dirname, '..', 'public', 'assets', 'optimized_signs');
const WEBP_QUALITY = 85; // 85% quality for WebP
const MAX_DIMENSION = 600; // Max width/height for images

// Statistics
let stats = {
  processed: 0,
  originalSize: 0,
  optimizedSize: 0,
  errors: 0
};

/**
 * Optimize a single image - convert PNG to WebP with compression
 */
async function optimizeImage(sourcePath, outputPath) {
  try {
    // Get original file size
    const originalStats = await stat(sourcePath);
    stats.originalSize += originalStats.size;

    // Change extension to .webp
    const webpPath = outputPath.replace(/\.png$/i, '.webp');

    // Process image: resize if needed, convert to WebP, compress
    const info = await sharp(sourcePath)
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: WEBP_QUALITY, effort: 6 })
      .toFile(webpPath);

    stats.optimizedSize += info.size;
    stats.processed++;

    const reduction = ((1 - info.size / originalStats.size) * 100).toFixed(1);
    console.log(`✓ ${basename(sourcePath)} → ${basename(webpPath)} - ${reduction}% smaller`);

  } catch (error) {
    stats.errors++;
    console.error(`✗ Error processing ${basename(sourcePath)}:`, error.message);
  }
}

/**
 * Main optimization process
 */
async function optimizeAllImages() {
  console.log('🎨 Starting image optimization to WebP...\n');

  try {
    // Dynamically import mkdir
    const { mkdir } = await import('fs/promises');

    // Create output directory
    await mkdir(OUTPUT_DIR, { recursive: true });

    // Get all PNG files
    const files = await readdir(SOURCE_DIR);
    const pngFiles = files.filter(f => f.toLowerCase().endsWith('.png'));

    console.log(`Found ${pngFiles.length} PNG images to optimize\n`);

    // Process in batches of 10 for better performance
    const BATCH_SIZE = 10;
    for (let i = 0; i < pngFiles.length; i += BATCH_SIZE) {
      const batch = pngFiles.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(file => {
          const sourcePath = join(SOURCE_DIR, file);
          const outputPath = join(OUTPUT_DIR, file);
          return optimizeImage(sourcePath, outputPath);
        })
      );

      // Progress update
      const progress = Math.min(i + BATCH_SIZE, pngFiles.length);
      console.log(`\nProgress: ${progress}/${pngFiles.length} images processed\n`);
    }

    // Final statistics
    console.log('\n' + '='.repeat(50));
    console.log('✨ Optimization Complete!\n');
    console.log(`📊 Statistics:`);
    console.log(`   - Processed: ${stats.processed} images`);
    console.log(`   - Errors: ${stats.errors}`);
    console.log(`   - Original size: ${(stats.originalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Optimized size: ${(stats.optimizedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Total reduction: ${((1 - stats.optimizedSize / stats.originalSize) * 100).toFixed(1)}%`);
    console.log(`   - Format: WebP for modern browsers`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run optimization
optimizeAllImages();
