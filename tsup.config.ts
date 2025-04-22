// import { polyfillNode } from 'esbuild-plugin-polyfill-node';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'], // Build for commonJS and ESmodules
  dts: true, // Generate declaration file (.d.ts)
  splitting: false,
  sourcemap: true,
  clean: true,
  platform: 'browser',
  // esbuildPlugins: [
  //   polyfillNode({
  //     globals: {
  //       buffer: true,
  //     },
  //     polyfills: {
  //       buffer: true,
  //     },
  //   }),
  // ],
});
