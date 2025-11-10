/**
 * Package extension for distribution
 * Creates a ZIP file of the dist directory
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '..', 'dist');
const outputFile = path.join(__dirname, '..', 'multi-ai-translator.zip');

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Remove existing zip file
if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
  console.log('Removed existing ZIP file');
}

// Create archive
const output = fs.createWriteStream(outputFile);
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

output.on('close', () => {
  const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`\n✓ Package created: multi-ai-translator.zip (${sizeInMB} MB)`);
  console.log(`  Total bytes: ${archive.pointer()}`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// Add dist directory contents
console.log('Creating package...');
archive.directory(distDir, false);

archive.finalize();
