#!/usr/bin/env node
/**
 * File Size Checker
 * Enforces file line limits across the codebase:
 * - Warning: 600 lines (soft limit)
 * - Error: 800 lines (hard limit, blocks CI)
 *
 * Counts only meaningful lines (skips blank lines and comments)
 */

const fs = require('fs');
const path = require('path');

const WARNING_THRESHOLD = 600;
const ERROR_THRESHOLD = 800;

// File patterns to check
const PATTERNS = [
  'apps/*/src/**/*.ts',
  'apps/*/src/**/*.tsx',
  'packages/*/src/**/*.ts',
  'packages/*/src/**/*.tsx',
];

// Directories to exclude
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.next', '.turbo', 'coverage'];

// File patterns to exclude (type declarations often mirror generated code)
const EXCLUDE_PATTERNS = [/\.d\.ts$/];

/**
 * Simple glob implementation for matching file patterns
 */
function matchFiles(pattern, baseDir) {
  const files = [];
  const parts = pattern.split('/');

  function walk(dir, patternIndex) {
    if (patternIndex >= parts.length) return;

    const part = parts[patternIndex];
    const isLast = patternIndex === parts.length - 1;

    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (EXCLUDE_DIRS.includes(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);

      if (part === '**') {
        // Match any depth
        if (entry.isDirectory()) {
          walk(fullPath, patternIndex); // Stay at **
          walk(fullPath, patternIndex + 1); // Move past **
        } else if (entry.isFile() && matchGlob(entry.name, parts.slice(patternIndex + 1).join('/'))) {
          files.push(fullPath);
        }
      } else if (part === '*') {
        // Match single level
        if (entry.isDirectory() && !isLast) {
          walk(fullPath, patternIndex + 1);
        }
      } else if (isLast && matchGlob(entry.name, part)) {
        // Final part with glob pattern
        if (entry.isFile()) {
          files.push(fullPath);
        }
      } else if (entry.name === part || matchGlob(entry.name, part)) {
        // Exact or glob match
        if (entry.isDirectory() && !isLast) {
          walk(fullPath, patternIndex + 1);
        } else if (entry.isFile() && isLast) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(baseDir, 0);
  return files;
}

/**
 * Simple glob pattern matching for filenames
 */
function matchGlob(filename, pattern) {
  // Handle *.{ts,tsx} pattern
  if (pattern.includes('{')) {
    const match = pattern.match(/\*\.{([^}]+)}/);
    if (match) {
      const extensions = match[1].split(',');
      const ext = path.extname(filename).slice(1);
      return extensions.includes(ext);
    }
  }

  // Handle *.ext pattern
  if (pattern.startsWith('*.')) {
    const ext = pattern.slice(2);
    return filename.endsWith('.' + ext);
  }

  return filename === pattern;
}

/**
 * Count meaningful lines in a file (skip blank lines and comments)
 */
function countMeaningfulLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  let count = 0;
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Handle block comments
    if (inBlockComment) {
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }

    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) {
        inBlockComment = true;
      }
      continue;
    }

    // Skip empty lines and single-line comments
    if (trimmed === '' || trimmed.startsWith('//')) {
      continue;
    }

    count++;
  }

  return count;
}

/**
 * Main execution
 */
function main() {
  const rootDir = path.resolve(__dirname, '..');
  const allFiles = new Set();

  // Collect all matching files
  for (const pattern of PATTERNS) {
    const files = matchFiles(pattern, rootDir);
    files.forEach((f) => allFiles.add(f));
  }

  const warnings = [];
  const errors = [];

  // Check each file
  for (const filePath of allFiles) {
    // Skip excluded patterns (e.g., .d.ts files)
    if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(filePath))) {
      continue;
    }

    const lineCount = countMeaningfulLines(filePath);
    const relativePath = path.relative(rootDir, filePath);

    if (lineCount > ERROR_THRESHOLD) {
      errors.push({ path: relativePath, lines: lineCount });
    } else if (lineCount > WARNING_THRESHOLD) {
      warnings.push({ path: relativePath, lines: lineCount });
    }
  }

  // Sort by line count descending
  warnings.sort((a, b) => b.lines - a.lines);
  errors.sort((a, b) => b.lines - a.lines);

  // Output results
  console.log('\n📏 File Size Check\n');
  console.log(`Thresholds: Warning > ${WARNING_THRESHOLD} lines, Error > ${ERROR_THRESHOLD} lines`);
  console.log(`Files checked: ${allFiles.size}\n`);

  if (errors.length > 0) {
    console.log(`❌ ERRORS (${errors.length} files exceed ${ERROR_THRESHOLD} lines):\n`);
    for (const { path: p, lines } of errors) {
      console.log(`   ${lines} lines  ${p}`);
    }
    console.log();
  }

  if (warnings.length > 0) {
    console.log(`⚠️  WARNINGS (${warnings.length} files exceed ${WARNING_THRESHOLD} lines):\n`);
    for (const { path: p, lines } of warnings) {
      console.log(`   ${lines} lines  ${p}`);
    }
    console.log();
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All files are within size limits.\n');
  }

  // Summary
  const total = errors.length + warnings.length;
  if (total > 0) {
    console.log('─'.repeat(60));
    console.log(`Summary: ${errors.length} errors, ${warnings.length} warnings`);
    console.log();
    console.log('Consider refactoring large files by:');
    console.log('  - Extracting helper functions to separate modules');
    console.log('  - Splitting large classes into smaller, focused ones');
    console.log('  - Moving constants and types to dedicated files');
    console.log();
  }

  // Exit with error code if any files exceed hard limit
  if (errors.length > 0) {
    process.exit(1);
  }
}

main();
