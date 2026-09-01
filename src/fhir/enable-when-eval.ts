import fhirpath from 'fhirpath';
import { FhirPathVariables } from './enable-when-expression';

/**
 * Evaluate a gate's `enableWhenExpression` against a variable environment, returning whether the
 * item should be shown. An empty or non-true result is treated as `false` (hidden until known),
 * matching native `enableWhen` semantics.
 *
 * Variables are passed as the fhirpath.js environment and referenced in the expression as `%name`.
 *
 * Time: `today()`/`now()` read the ambient clock (fhirpath.js caches it for the duration of one
 * evaluation). Tests pin it with fake timers; production uses device time.
 *
 * NOTE: this module imports `fhirpath` and must not be re-exported from the fhir barrel until the
 * packaging strategy is decided, so that consumers which only need the subset/fixture data
 * (e.g. next-research-studio validation) do not pull the engine into their bundle.
 */
export const evaluateEnableWhen = (expression: string, variables: FhirPathVariables): boolean => {
  const result = fhirpath.evaluate({}, expression, variables);
  return Array.isArray(result) && result[0] === true;
};
