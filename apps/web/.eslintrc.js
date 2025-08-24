// TODO: Install ESLint dependencies in @dhanam/config package or as devDependencies here
// Required packages: @typescript-eslint/eslint-plugin, @typescript-eslint/parser, 
// eslint-plugin-import, eslint-plugin-react, eslint-plugin-react-hooks, 
// eslint-plugin-jsx-a11y, eslint-plugin-prettier, eslint-import-resolver-typescript
module.exports = {
  extends: ['../../packages/config/eslint/nextjs.js'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
};