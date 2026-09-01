import { defineConfig } from 'tsup';

export default defineConfig({
  // `index` is the main barrel (fhirpath-free). `fhirpath` is a separate subpath entry
  // (`@d4l/collect-lib/fhirpath`) so only consumers that evaluate enableWhen expressions
  // (phoenix) pull in the fhirpath.js engine; studio's validation imports the barrel only.
  entry: { index: 'src/index.ts', fhirpath: 'src/fhir/enable-when-eval.ts' },
  format: ['cjs', 'esm'], // Build for commonJS and ESmodules
  dts: true, // Generate declaration file (.d.ts)
  splitting: true,
  sourcemap: true,
  clean: true,
  platform: 'browser',
});
