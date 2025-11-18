module.exports = {
  extends: [require.resolve('@dhanam/config/eslint/react-native')],
  root: true,
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules', '../../packages'],
      },
    },
  },
  rules: {
    // Disable noisy React Native rules for mobile development
    'react-native/no-inline-styles': 'off',
    'react-native/no-color-literals': 'off',
    'react-native/no-raw-text': 'off',

    // Keep important warnings
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': 'off', // Allow console in mobile for debugging
    'react-hooks/exhaustive-deps': 'warn',

    // Allow workspace imports
    'import/no-unresolved': ['error', { ignore: ['^@dhanam/'] }],
  },
  ignorePatterns: [
    '.eslintrc.js',
    'node_modules/',
    '.expo/',
    'dist/',
    'build/',
    'coverage/',
    '*.config.js',
    '*.config.ts',
  ],
};