module.exports = {
  extends: [require.resolve('@dhanam/config/eslint/nestjs')],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
  ignorePatterns: ['test/**/*.ts', '**/*.spec.ts', '**/__tests__/**/*.ts'],
  rules: {
    // Disable warnings that are acceptable in this codebase
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
};