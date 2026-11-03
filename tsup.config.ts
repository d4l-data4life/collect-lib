import { defineConfig } from 'tsup';

export default defineConfig({
  // `index` is the main barrel (fhirpath-free, grpc-modules-free). `fhirpath` is a separate subpath
  // entry (`@d4l/collect-lib/fhirpath`) so the fhirpath.js engine is loaded only where expressions
  // are evaluated (phoenix; Studio's synthetic-data generator), not on every page that imports the
  // barrel. See the note in src/fhir/enable-when-eval.ts. `fhir-to-questions` is the same idea for
  // the shared FHIR->proto Question parser (src/fhir/questions.ts).
  entry: {
    index: 'src/index.ts',
    fhirpath: 'src/fhir/enable-when-eval.ts',
    'fhir-to-questions': 'src/fhir/questions.ts',
  },
  format: ['cjs', 'esm'], // Build for commonJS and ESmodules
  dts: true, // Generate declaration file (.d.ts)
  splitting: true,
  sourcemap: true,
  clean: true,
  platform: 'browser',
});
