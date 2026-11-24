// Type-only import: the main barrel and the Go guard bundle must not load grpc-modules at runtime.
import type { Operator } from '@d4l/grpc-modules/research-pillars';

type FhirOperator = fhir5.QuestionnaireItemEnableWhen['operator'];

// Keyed by the proto Operator's numbers and by its JSON names.
const FHIR_OPERATORS = new Map<Operator | string, FhirOperator>([
  [0, 'exists'],
  ['exists', 'exists'],
  [1, '='],
  ['eq', '='],
  [2, '!='],
  ['neq', '!='],
  [3, '>'],
  ['gt', '>'],
  [4, '<'],
  ['lt', '<'],
  [5, '>='],
  ['gteq', '>='],
  [6, '<='],
  ['lteq', '<='],
]);

/**
 * Maps a proto enable condition operator to its FHIR operator.
 * Accepts the operator's JSON name too, as in a Questionnaire Definition read from JSON.
 * Returns undefined for an unrecognized operator.
 */
export const toFhirOperator = (operator: Operator): FhirOperator | undefined =>
  FHIR_OPERATORS.get(operator);
