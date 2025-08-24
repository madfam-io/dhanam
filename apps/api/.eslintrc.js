module.exports = {
  extends: ['@dhanam/config/eslint/nestjs.js'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
};