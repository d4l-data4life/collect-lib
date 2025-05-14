import { ObservationTypeSystem } from './constants';
import { StringTemplater } from './utils';

export function generateFHIREligibility(
  id: string,
  surveyName: string,
  createdAt: string,
  value: number,
  max: number,
  stringTemplater: StringTemplater
): fhir5.Observation {
  return {
    id,
    resourceType: 'Observation',
    status: 'final',
    extension: [
      {
        url: 'http://hl7.org/fhir/StructureDefinition/workflow-adheresTo',
        valueCanonical: stringTemplater(
          `http://{{fhir-base-host}}/r5/Questionnaire/{{program-name}}/${surveyName}|1.0.0`
        ),
      },
    ],
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
      coding: [
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
