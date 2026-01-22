import { SurveyScoring } from '../../types';
import {
  calculateQuestionnaireScoreRange,
  calculateScoreRangeForItem,
} from '../questionnaireScore';
import {
  generateContains,
  negativeScoring,
  ociRScoring,
  ociRTestQuestionnaire,
  phq9Questionnaire,
  phq9Scoring,
} from './fixtures';

describe('calculateQuestionnaireScoreRange', () => {
  it('works as expected', () => {
    const expected = { min: 0, max: 72 };

    const result = calculateQuestionnaireScoreRange(ociRTestQuestionnaire, ociRScoring);

    expect(result).toEqual(expected);
  });

  it('works with negative scoring', () => {
    const expected = { min: -36, max: 36 };

    const result = calculateQuestionnaireScoreRange(ociRTestQuestionnaire, negativeScoring);

    expect(result).toEqual(expected);
  });

  it('works with unscored question', () => {
    const expected = { min: 0, max: 27 };

    const result = calculateQuestionnaireScoreRange(phq9Questionnaire, phq9Scoring);

    expect(result).toEqual(expected);
  });
});

describe('calculateScoreRangeForItem', () => {
  it('works for valueSet', () => {
    const expected = { min: 0, max: 4 };
    const item: fhir5.QuestionnaireItem = {
      type: 'coding',
      answerValueSet: '#1',
    } as fhir5.QuestionnaireItem;
    const valueSets: { [key: string]: fhir5.ValueSet } = {
      '1': {
        resourceType: 'ValueSet',
        expansion: {
          contains: generateContains('http://fhir.data4life.care/r5/CodeSystem/eligibility', [
            'not_at_all',
            'a_little',
            'moderately',
            'a_lot',
            'extremely',
          ]),
        },
      } as fhir5.ValueSet,
    };

    const result = calculateScoreRangeForItem(item, valueSets, ociRScoring);

    expect(result).toEqual(expected);
  });

  it('works for decimal', () => {
    const expected = { min: -5, max: 10 };
    const item: fhir5.QuestionnaireItem = {
      type: 'decimal',
      linkId: 'decimal_item',
    } as fhir5.QuestionnaireItem;
    const valueSets: { [key: string]: fhir5.ValueSet } = {};
    const scoring: SurveyScoring = {
      scores: {
        number: {
          decimal_item: [
            { threshold: 10, score: 5, operator: 'gt' },
            { threshold: -10, score: 10, operator: 'lt' },
            { threshold: 0, score: -5, operator: 'eq' },
          ],
        },
      },
    };

    const result = calculateScoreRangeForItem(item, valueSets, scoring);

    expect(result).toEqual(expected);
  });

  it('works for nested items', () => {
    const expected = { min: -55, max: 110 };
    const item: fhir5.QuestionnaireItem = {
      type: 'group',
      item: [
        {
          type: 'decimal',
          linkId: 'decimal_item',
        } as fhir5.QuestionnaireItem,
        {
          type: 'decimal',
          linkId: 'decimal_item_2',
        } as fhir5.QuestionnaireItem,
      ],
    } as fhir5.QuestionnaireItem;
    const valueSets: { [key: string]: fhir5.ValueSet } = {};
    const scoring: SurveyScoring = {
      scores: {
        number: {
          decimal_item: [
            { threshold: 10, score: 5, operator: 'gt' },
            { threshold: -10, score: 10, operator: 'lt' },
            { threshold: 0, score: -5, operator: 'eq' },
          ],
          decimal_item_2: [
            { threshold: 100, score: -50, operator: 'gt' },
            { threshold: -10, score: 50, operator: 'lt' },
            { threshold: 0, score: 100, operator: 'eq' },
          ],
        },
      },
    };

    const result = calculateScoreRangeForItem(item, valueSets, scoring);

    expect(result).toEqual(expected);
  });
});
