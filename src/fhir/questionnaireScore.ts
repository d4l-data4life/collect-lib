import { QuestionnaireScore, SurveyScoring } from '../types';
import { ObservationTypeSystem } from './constants';
import { indexArrayBy, StringTemplater } from './utils';

export function generateFHIRQuestionnaireScore(
  id: string,
  data: QuestionnaireScore & { createdAt: string },
  stringTemplater: StringTemplater
): fhir5.Observation {
  const { questionnaireName, createdAt, value, min, max, derivedFrom } = data;

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
          value: min,
        },
        high: {
          value: max,
        },
      },
    ],
  };
}

type Range = { min: number; max: number };

export function calculateQuestionnaireScoreRange(
  questionnaire: fhir5.Questionnaire,
  scoring: SurveyScoring | undefined
): Range {
  if (!scoring || !questionnaire.item?.length) {
    return { min: 0, max: 0 };
  }

  const valueSets: { [key: string]: fhir5.ValueSet } = indexArrayBy(
    (questionnaire.contained as fhir5.ValueSet[]) || [],
    'id'
  );

  return questionnaire.item.reduce(
    (acc, curr) => {
      const { min, max } = calculateScoreRangeForItem(curr, valueSets, scoring);
      return { min: acc.min + min, max: acc.max + max };
    },
    { min: 0, max: 0 }
  );
}

export function calculateScoreRangeForItem(
  item: fhir5.QuestionnaireItem,
  valueSets: { [key: string]: fhir5.ValueSet },
  scoring: SurveyScoring
): Range {
  if (item.item && item.item.length > 0) {
    return item.item.reduce(
      (acc, curr) => {
        const { min, max } = calculateScoreRangeForItem(curr, valueSets, scoring);
        return { min: acc.min + min, max: acc.max + max };
      },
      { min: 0, max: 0 }
    );
  }
  if (item.type === 'coding') {
    return calculateValueSetScore(item, valueSets, scoring);
  }
  if (item.type === 'decimal' || item.type === 'integer') {
    return calculateNumericScore(item, scoring);
  }
  return { min: 0, max: 0 };
}

function calculateValueSetScore(
  item: fhir5.QuestionnaireItem,
  valueSets: { [key: string]: fhir5.ValueSet },
  scoring: SurveyScoring
): Range {
  if (!item.answerValueSet) {
    return { min: 0, max: 0 };
  }

  const valueSet = valueSets[item.answerValueSet.replace('#', '')];
  if (valueSet === undefined) {
    return { min: 0, max: 0 };
  }

  const uniqueCodesystems = (valueSet.expansion?.contains || []).reduce<string[]>((acc, { system }) => {
    if (system && !acc.includes(system)) {
      acc.push(system);
    }
    return acc;
  }, []);
  const scoringSystems = scoring.scores?.valueset ?? {};
  const possibleValues = uniqueCodesystems.flatMap((system) => {
    return Object.values(scoringSystems[system] ?? {});
  });

  if (possibleValues.length === 0) {
    return { min: 0, max: 0 };
  }

  return { min: Math.min(...possibleValues), max: Math.max(...possibleValues) };
}

function calculateNumericScore(item: fhir5.QuestionnaireItem, scoring: SurveyScoring): Range {
  const scoringNumbers = scoring.scores?.number ?? {};
  const threshold = scoringNumbers[item.linkId || ''];
  if (threshold) {
    const scores = threshold.map((t) => t.score);
    return { min: Math.min(...scores), max: Math.max(...scores) };
  }
  return { min: 0, max: 0 };
}
