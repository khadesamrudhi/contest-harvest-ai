// src/jobs/assetOptimization.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Optimizes all images in the given directory (e.g., compresses and resizes).
 * @param {string} assetsDir - Directory containing images to optimize.
 * @param {Object} [options] - Optional settings (width, quality).
 */
async function processAssets(assetsDir = './uploads', options = { width: 800, quality: 80 }) {
  try {
    const files = fs.readdirSync(assetsDir);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;
      const inputPath = path.join(assetsDir, file);
      const outputPath = path.join(assetsDir, 'optimized_' + file);
      await sharp(inputPath)
        .resize({ width: options.width })
        .toFormat('webp', { quality: options.quality })
        .toFile(outputPath);
      // Optionally, remove the original file after optimization
      // fs.unlinkSync(inputPath);
      console.log(`Optimized: ${file} -> optimized_${file}`);
    }
    console.log('Asset optimization complete.');
  } catch (error) {
    console.error('Asset optimization error:', error.message);
  }
}

module.exports = { processAssets };
