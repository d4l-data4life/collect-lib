import { QuestionnaireScore } from '../types';
import { ObservationTypeSystem } from './constants';
import { StringTemplater } from './utils';

export function generateFHIRQuestionnaireScore(
  id: string,
  data: QuestionnaireScore & { createdAt: string },
  stringTemplater: StringTemplater
): fhir5.Observation {
  const { questionnaireName, createdAt, value, max, derivedFrom } = data;

  return {
    id,
    resourceType: 'Observation',
    status: 'final',
    extension: [
      {
        url: 'http://hl7.org/fhir/StructureDefinition/workflow-adheresTo',
        valueCanonical: stringTemplater(
          `http://{{fhir-base-host}}/r5/Questionnaire/{{program-name}}/${questionnaireName}|1.0.0`
        ),
      },
    ],
    ...(derivedFrom && {
      derivedFrom: [
        {
          reference: `QuestionnaireResponse/${derivedFrom}`,
        },
      ],
    }),
    category: [
      {
        coding: [
          {
            code: 'survey',
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          },
        ],
      },
    ],
    code: {
      coding: derivedFrom
        ? [
            {
              system: ObservationTypeSystem,
              code: 'questionnaire_score',
              display: 'Questionnaire score',
            },
          ]
        : [
            {
              system: ObservationTypeSystem,
              code: 'study_eligibility_score',
              display: 'Study eligibility score',
            },
          ],
    },
    effectiveDateTime: createdAt,
    valueQuantity: {
      value: value,
    },
    referenceRange: [
      {
        low: {
          value: 0,
        },
        high: {
          value: max,
        },
      },
    ],
  };
}
