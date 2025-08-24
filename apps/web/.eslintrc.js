module.exports = {
  extends: [require.resolve('@dhanam/config/eslint/nextjs')],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
  ignorePatterns: ['**/*.test.tsx', '**/*.test.ts'],
};
