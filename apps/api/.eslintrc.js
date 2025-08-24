module.exports = {
  extends: [require.resolve('@dhanam/config/eslint/nestjs')],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
  ignorePatterns: ['test/**/*.ts'],
};