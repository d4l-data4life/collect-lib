import { ObservationTypeSystem } from './constants';
import { StringTemplater } from './utils';

export function generateFHIRTag(
  id: string,
  code: string,
  date: string,
  labels: { [key: string]: string },
  stringTemplater: StringTemplater
): fhir5.Observation {
  return {
    id,
    resourceType: 'Observation',
    status: 'final',
    code: {
      coding: [
        {
          system: ObservationTypeSystem,
          code: 'standalone_user_tag',
          display: 'Stand-alone user-selected tag',
        },
      ],
    },
    effectiveDateTime: date,
    valueCodeableConcept: {
      coding: [
        {
          system: stringTemplater(
            'http://{{fhir-base-host}}/r5/CodeSystem/{{program-name}}/standalone-study-tags'
          ),
          code: code,
          display: labels.en || Object.values(labels)[0],
        },
      ],
    },
  };
}
