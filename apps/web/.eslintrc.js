module.exports = {
  extends: [require.resolve('@dhanam/config/eslint/nextjs')],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
  ignorePatterns: ['**/*.test.tsx', '**/*.test.ts'],
  rules: {
    // Modern React handles character escaping automatically
    // Using actual quotes/apostrophes is cleaner than HTML entities
    'react/no-unescaped-entities': 'off',
  },
};
