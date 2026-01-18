import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false,  // Disable DTS due to strict mode TypeScript errors in source
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@dhanam/shared'],
});
