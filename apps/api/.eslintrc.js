module.exports = {
  extends: [require.resolve('@dhanam/config/eslint/nestjs')],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
  ignorePatterns: [
    'test/**/*.ts',
    '**/*.spec.ts',
    '**/__tests__/**/*.ts',
    'scripts/**/*.ts',
    'prisma/**/*.ts',
  ],
  rules: {
    // Disable warnings that are acceptable in this codebase
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    // Disable import/no-unresolved for monorepo packages, path aliases, and Prisma
    // TypeScript handles resolution for these via tsconfig paths
    'import/no-unresolved': [
      'error',
      {
        ignore: [
          '^@dhanam/',
          '^@prisma/client/runtime',
          '^@core/',
          '^@modules/',
          '^@shared/',
          '^@db$',
          '^@db/',
          '^~/',
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['src/modules/analytics/analytics.service.ts'],
      rules: { 'max-lines': 'off' },
    },
  ],
};
