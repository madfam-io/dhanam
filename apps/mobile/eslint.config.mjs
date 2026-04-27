// =============================================================================
// apps/mobile — flat config for the React Native app
// =============================================================================

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import reactNative from '@dhanam/config/eslint/react-native';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...reactNative,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
      },
    },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
          moduleDirectory: ['node_modules', '../../packages'],
        },
      },
    },
    rules: {
      // Mobile-specific overrides matching legacy .eslintrc.js
      'react-native/no-inline-styles': 'off',
      'react-native/no-color-literals': 'off',
      'react-native/no-raw-text': 'off',

      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'off', // Allow console in mobile for debugging
      'react-hooks/exhaustive-deps': 'warn',

      'import/no-unresolved': ['error', { ignore: ['^@dhanam/', '^@/'] }],
    },
  },

  // Jest globals for test files (describe, it, expect, beforeEach, etc.)
  // Scoped to test files only so production code keeps strict no-undef checks.
  {
    files: [
      '**/__tests__/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      'test/**/*.{ts,tsx}',
    ],
    languageOptions: {
      globals: { ...globals.jest },
    },
  },

  // Mobile-specific extra ignores
  {
    ignores: ['.expo/', 'metro.config.js'],
  },
];
