import gulp from 'gulp';
import { deleteAsync } from 'del';
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
