/**
 * Package extension for distribution
 * Creates ZIP files for Chrome/Edge and Firefox
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDirChromium = path.join(__dirname, '..', 'dist');
const distDirFirefox = path.join(__dirname, '..', 'dist-firefox');
const outputDir = path.join(__dirname, '..', 'packages');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Check if dist directory exists
if (!fs.existsSync(distDirChromium)) {
  console.error('Error: dist directory not found. Run "yarn build:chromium" first.');
  process.exit(1);
}

if (!fs.existsSync(distDirFirefox)) {
  console.error('Error: dist-firefox directory not found. Run "yarn build:firefox" first.');
  process.exit(1);
}

/**
 * Create a ZIP package
 */
function createPackage(name, sourceDir, description) {
  const outputFile = path.join(outputDir, `${name}.zip`);

  // Remove existing zip file
  if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
  }

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputFile);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    output.on('close', () => {
      const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`✓ ${description}: ${name}.zip (${sizeInMB} MB)`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add dist directory contents
    archive.directory(sourceDir, false);

    archive.finalize();
  });
}

// Create packages
console.log('\nCreating multi-browser packages...\n');

Promise.all([
  createPackage('multi-ai-translator-chrome', distDirChromium, 'Chrome/Edge package'),
  createPackage('multi-ai-translator-firefox', distDirFirefox, 'Firefox package')
])
  .then(() => {
    console.log('\n✓ All packages created successfully!');
    console.log('\nPackages:');
    console.log('  - multi-ai-translator-chrome.zip (for Chrome and Edge)');
    console.log('  - multi-ai-translator-firefox.zip (for Firefox)');
  })
  .catch((err) => {
    console.error('Error creating packages:', err);
    process.exit(1);
  });
