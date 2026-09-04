import fhirpath from 'fhirpath';
import { FhirPathVariables } from './enable-when-expression';

/**
 * Evaluate an `enableWhenExpression` against a variable environment, returning whether the
 * item should be shown. An empty or non-true result is treated as `false` (hidden until known),
 * matching native `enableWhen` semantics. An evaluation error (malformed expression, type
 * mismatch such as a raw string compared to a number, unbound variable) is also `false`: the
 * fail-hidden contract must not depend on every caller validating the expression first.
 *
 * Variables are passed as the fhirpath.js environment and referenced in the expression as `%name`.
 *
 * Time: `today()`/`now()` read the ambient clock (fhirpath.js caches it for the duration of one
 * evaluation). Tests pin it with fake timers; production uses device time.
 *
 * Packaging: this module imports the fhirpath.js engine (~157 KB gzipped) and is deliberately
 * published on its own subpath (`@d4l/collect-lib/fhirpath`, see tsup.config.ts) instead of the
 * barrel. The barrel is imported on nearly every Research Studio page, while evaluation is only
 * needed where an expression is actually run (phoenix, and Studio's synthetic-data generator); the
 * package declares no `sideEffects: false` (it imports polyfills), so bundlers could not drop the
 * engine from the barrel on their own. Do not re-export it from `fhir/index.ts`.
 */
export const evaluateEnableWhen = (expression: string, variables: FhirPathVariables): boolean => {
  try {
    const result = fhirpath.evaluate({}, expression, variables);
    return Array.isArray(result) && result[0] === true;
  } catch {
    return false;
  }
};
