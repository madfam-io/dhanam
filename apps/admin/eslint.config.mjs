// =============================================================================
// apps/admin — flat config (matches legacy .eslintrc.json — next/core-web-vitals only)
// =============================================================================

import nextjs from '@dhanam/config/eslint/nextjs';

// Inline Jest globals — avoids needing a direct `globals` dep in this app.
// Mirrors `globals.jest` from the `globals` package.
const jestGlobals = {
  afterAll: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  beforeEach: 'readonly',
  describe: 'readonly',
  expect: 'readonly',
  fdescribe: 'readonly',
  fit: 'readonly',
  it: 'readonly',
  jest: 'readonly',
  pit: 'readonly',
  require: 'readonly',
  test: 'readonly',
  xdescribe: 'readonly',
  xit: 'readonly',
  xtest: 'readonly',
};

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nextjs,

  // Local overrides matching the legacy .eslintrc.json
  {
    rules: {
      'no-unused-vars': 'off',
      'prettier/prettier': 'off',
    },
  },

  // TypeScript files: disable core no-undef. TypeScript's compiler already
  // checks for undeclared identifiers (via tsc) with more accuracy than
  // ESLint can — globals like React, JSX, RequestInit, DOM/Node types are
  // resolved by the TS lib config, not by ESLint. This is the official
  // typescript-eslint guidance: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-undef': 'off',
    },
  },

  // Test files: relax type strictness + add Jest globals
  {
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}', 'test/**/*'],
    languageOptions: {
      globals: jestGlobals,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'max-lines': 'off',
    },
  },
];
