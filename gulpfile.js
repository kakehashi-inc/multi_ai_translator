import gulp from 'gulp';
import { deleteAsync } from 'del';
import { spawn } from 'child_process';
import eslint from 'gulp-eslint-new';

/**
 * Clean dist directory
 */
export function clean() {
  return deleteAsync(['dist', '*.zip']);
}

/**
 * Run ESLint
 */
export function lint() {
  return gulp
    .src(['src/**/*.js'])
    .pipe(eslint({ fix: false }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

/**
 * Run Prettier to format code
 */
export function format() {
  return runCommand('prettier', ['--write', 'src/**/*.js', '*.js', '*.json']);
}

/**
 * Build extension with Vite
 */
export function build() {
  return runCommand('vite', ['build']);
}

/**
 * Build extension in watch mode
 */
export function dev() {
  return runCommand('vite', ['build', '--watch']);
}

/**
 * Create distribution packages
 */
export function packageExt() {
  return runCommand('node', ['scripts/package.js']);
}

/**
 * Run all checks (lint + build)
 */
export const check = gulp.series(lint, build);

/**
 * Full build pipeline (clean, lint, build, package)
 */
export const dist = gulp.series(clean, lint, build, packageExt);

/**
 * Default task
 */
export default build;

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
