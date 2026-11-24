// Type-only import: the main barrel must not load grpc-modules at runtime.
import type { Question } from '@d4l/grpc-modules/research-pillars';

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
  minLabel?: Record<string, string>;
  maxLabel?: Record<string, string>;
  step?: number;
  orientation?: 'horizontal' | 'vertical';
  inputLabel?: Record<string, string>;
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
