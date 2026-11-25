import { MinValueExtension, SliderMinLabelExtension } from '../constants';
import { parseFHIRQuestionnaire } from '../questionnaire';
import { getQuestionConfig, QuestionConfig } from '../question-config';

const questionnaire = (language: string, minLabel: string): fhir5.Questionnaire => ({
  resourceType: 'Questionnaire',
  status: 'active',
  name: 'pain',
  version: '1.0.0',
  language,
  item: [
    {
      linkId: 'pain-level',
      type: 'decimal',
      text: 'Pain',
      extension: [
        { url: MinValueExtension, valueDecimal: 0 },
        { url: SliderMinLabelExtension, valueString: minLabel },
      ],
    },
    { linkId: 'comment', type: 'string', text: 'Comment' },
  ],
});

describe('getQuestionConfig', () => {
  const [painLevel, comment] = parseFHIRQuestionnaire({
    en: questionnaire('en', 'No pain'),
    de: questionnaire('de', 'Keine Schmerzen'),
  }).questions;

  it('returns the config of a parsed question with labels keyed by language', () => {
    const expected: QuestionConfig = { min: 0, minLabel: { en: 'No pain', de: 'Keine Schmerzen' } };
    expect(getQuestionConfig(painLevel)).toEqual(expected);
  });

  it('returns an empty config for a question without config', () => {
    expect(comment.config).toBeUndefined();
    expect(getQuestionConfig(comment)).toEqual({});
  });
});
