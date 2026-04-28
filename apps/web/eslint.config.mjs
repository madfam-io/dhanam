// =============================================================================
// apps/web — flat config for the Next.js web app
// =============================================================================

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import nextjs from '@dhanam/config/eslint/nextjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nextjs,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: true,
      },
    },
  },

  // Test files: relaxed
  {
    files: ['**/*.test.{ts,tsx}', 'src/__mocks__/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'max-lines': 'off',
    },
  },
];
