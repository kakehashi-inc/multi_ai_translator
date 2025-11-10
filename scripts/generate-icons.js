/**
 * Generate icon files
 * Creates simple placeholder icons in different sizes
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconSizes = [16, 48, 128];
const iconsDir = path.join(__dirname, '..', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG for each size
iconSizes.forEach(size => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>
  <text x="50%" y="50%" text-anchor="middle" dy="${size * 0.1}"
        font-family="Arial, sans-serif" font-size="${size * 0.5}"
        font-weight="bold" fill="white">AI</text>
  <text x="50%" y="75%" text-anchor="middle" dy="${size * 0.05}"
        font-family="Arial, sans-serif" font-size="${size * 0.15}"
        fill="white" opacity="0.9">T</text>
</svg>`;

  const filename = `icon-${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`Generated ${filename}`);
});

// Create a simple PNG placeholder using data URI
// For production, you should use proper PNG files
iconSizes.forEach(size => {
  // For now, just copy SVG as PNG placeholder
  // In production, use a library like 'sharp' or 'canvas' to generate actual PNGs
  const pngPlaceholder = `<!-- PNG placeholder for ${size}x${size} icon -->
<!-- Replace this with actual PNG file -->
<!-- Use tools like Inkscape, GIMP, or online converters to convert the SVG to PNG -->`;

  const filename = `icon-${size}.png.placeholder`;
  fs.writeFileSync(path.join(iconsDir, filename), pngPlaceholder);
});

console.log('\nIcon generation complete!');
console.log('SVG icons created. Please convert them to PNG using:');
console.log('- Inkscape: inkscape icon.svg --export-type=png --export-width=SIZE');
console.log('- GIMP: File > Export As > PNG');
console.log('- Online: https://cloudconvert.com/svg-to-png');
