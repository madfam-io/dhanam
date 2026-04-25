// =============================================================================
// apps/mobile — flat config for the React Native app
// =============================================================================

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import reactNative from '@dhanam/config/eslint/react-native';

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

  // Mobile-specific extra ignores
  {
    ignores: ['.expo/', 'metro.config.js'],
  },
];
