import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Temporarily disabled due to React 18/19 type conflicts in lucide-react
  external: ['react', 'react-dom'],
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
});