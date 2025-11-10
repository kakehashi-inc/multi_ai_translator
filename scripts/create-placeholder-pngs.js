/**
 * Create placeholder PNG icons
 * These are minimal 1x1 pixel PNGs that can be replaced with proper icons later
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconSizes = [16, 48, 128];
const iconsDir = path.join(__dirname, '..', 'icons');

// Minimal PNG data (1x1 purple pixel) in base64
const minimalPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

// Create placeholder PNGs for each size
iconSizes.forEach(size => {
  const filename = `icon-${size}.png`;
  fs.writeFileSync(path.join(iconsDir, filename), minimalPNG);
  console.log(`Created placeholder ${filename}`);
});

console.log('\nPlaceholder PNG icons created!');
console.log('These are minimal 1x1 pixel placeholders.');
console.log('Replace them with proper icons by converting the SVG files to PNG.');
