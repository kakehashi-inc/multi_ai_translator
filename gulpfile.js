import gulp from 'gulp';
import { deleteAsync } from 'del';
import { spawn } from 'child_process';
import eslint from 'gulp-eslint-new';

/**
 * Clean dist directory
 */
export function clean() {
  return deleteAsync(['dist', 'dist-firefox', 'packages']);
}

/**
 * Run ESLint
 */
export function lint() {
  return gulp
    .src(['src/**/*.ts'])
    .pipe(eslint({ fix: false }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

/**
 * Run Prettier to format code
 */
export function format() {
  return runCommand('prettier', ['--write', 'src/**/*.{ts,js,css}', '*.json']);
}

/**
 * Create distribution packages
 */
export function packageExt() {
  return runCommand('node', ['scripts/package.js']);
}

/**
 * Helper function to run command
 */
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}
