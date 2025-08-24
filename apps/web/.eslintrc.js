module.exports = {
  extends: ['@dhanam/config/eslint/nextjs.js'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
};