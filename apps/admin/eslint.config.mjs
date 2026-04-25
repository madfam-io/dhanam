// =============================================================================
// apps/admin — flat config (matches legacy .eslintrc.json — next/core-web-vitals only)
// =============================================================================

import nextjs from '@dhanam/config/eslint/nextjs';

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

  {
    files: ['**/*.test.{ts,tsx}', 'test/**/*'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'max-lines': 'off',
    },
  },
];
