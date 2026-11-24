import { Operator, operatorFromJSON } from '@d4l/grpc-modules/research-pillars';

type FhirOperator = fhir5.QuestionnaireItemEnableWhen['operator'];

const FHIR_OPERATORS: Record<Exclude<Operator, Operator.UNRECOGNIZED>, FhirOperator> = {
  [Operator.exists]: 'exists',
  [Operator.eq]: '=',
  [Operator.neq]: '!=',
  [Operator.gt]: '>',
  [Operator.lt]: '<',
  [Operator.gteq]: '>=',
  [Operator.lteq]: '<=',
};

/**
 * Maps a proto enable condition operator to its FHIR operator.
 * Accepts the operator's JSON name too, as in a Questionnaire Definition read from JSON.
 * Returns undefined for an unrecognized operator.
 */
export const toFhirOperator = (operator: Operator): FhirOperator | undefined => {
  const normalized = operatorFromJSON(operator);
  return normalized === Operator.UNRECOGNIZED ? undefined : FHIR_OPERATORS[normalized];
};
