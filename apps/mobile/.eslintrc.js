module.exports = {
  extends: [require.resolve('@dhanam/config/eslint/react-native')],
  root: true,
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['.eslintrc.js'],
};