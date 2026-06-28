#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/check-html.mjs <file>');
  process.exit(1);
}

const html = await readFile(file, 'utf8');
const required = [
  '<!doctype html>',
  'window.SYNTHRO_LESSON',
  'data-exercise-type="code-blanks"',
  'data-exercise-type="parsons"',
  'data-exercise-type="contrast"',
  'Synthro interactive lesson'
];

const missing = required.filter(item => !html.includes(item));
if (missing.length) {
  console.error(`HTML smoke check failed. Missing: ${missing.join(', ')}`);
  process.exit(1);
}

console.log(`HTML smoke check passed for ${file}`);
