import type { QuestionnaireMap } from '../parser/questionnaire';
import { DeepPartial, Questionnaire } from '@d4l/grpc-modules/research-pillars';
import { createContext, GenerationOptions } from './context';
import { optional } from './extensions';
import { generateItem } from './questions';

export const PUBLISHER_NAME = 'D4L data4life gGmbH';
export const PUBLISHER_URL = 'https://www.data4life.care';

/**
 * Generation: one FHIR Questionnaire per language from a Questionnaire Definition.
 * The output depends only on its inputs, so a Canonical Definition survives a Round Trip through
 * `parseFHIRQuestionnaire` unchanged.
 * Throws on invalid input, e.g. a missing translation or an unsupported input type.
 *
 * The definition may also be proto JSON, e.g. from Go's protojson, which omits empty and default
 * fields. `fromJSON` restores them, and copies a complete ts-proto object unchanged.
 */
export const generateFHIRQuestionnaire = (
  input: DeepPartial<Questionnaire>,
  options: GenerationOptions
): QuestionnaireMap => {
  const definition = Questionnaire.fromJSON(input);
  const ctx = createContext(definition, options);
  const questionnaires: QuestionnaireMap = {};
  for (const language of options.languages) {
    const contained: fhir5.ValueSet[] = [];
    const item = definition.questions.map((q) => generateItem(q, language, contained, ctx));
    questionnaires[language] = {
      resourceType: 'Questionnaire',
      language,
      ...optional('name', definition.name),
      url: ctx.questionnaireUrl,
      status: 'active',
      publisher: PUBLISHER_NAME,
      contact: [{ name: PUBLISHER_NAME, telecom: [{ system: 'url', value: PUBLISHER_URL }] }],
      ...optional('version', definition.version),
      ...optional('title', definition.title?.[language]),
      ...optional('date', options.date),
      subjectType: ['Patient'],
      ...(contained.length > 0 && { contained }),
      ...(item.length > 0 && { item }),
    };
  }
  return questionnaires;
};
