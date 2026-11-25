// Type-only import: the main barrel must not load grpc-modules at runtime.
import type { Question } from '@d4l/grpc-modules/research-pillars';
import type { TranslatedString } from '../types';

export type PostalCodeCountrySource =
  | { fromItem: string; fixedCountry?: never }
  | { fromItem?: never; fixedCountry: { system: string; code: string } };

/**
 * The shape Parsing gives a Questionnaire Definition question's untyped `config`.
 * Labels are keyed by language.
 */
export type QuestionConfig = {
  max?: number | string;
  min?: number | string;
  minLabel?: TranslatedString;
  maxLabel?: TranslatedString;
  step?: number;
  orientation?: 'horizontal' | 'vertical';
  inputLabel?: TranslatedString;
  minLength?: number;
  maxLength?: number;
  countrySource?: PostalCodeCountrySource;
  placeholders?: string[];
};

/**
 * Returns a question's config as QuestionConfig, or an empty config when it has none.
 */
export const getQuestionConfig = (question: Question): QuestionConfig =>
  (question.config ?? {}) as QuestionConfig;
