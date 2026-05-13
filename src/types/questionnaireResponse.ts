export interface QuestionnaireResponse {
  status: fhir5.QuestionnaireResponse['status'];
  language: string;
  answers: {
    id: string;
    type: QuestionInputType;
    response: ResponseValue | ResponseValue[];
    text: string;
  }[];
  questionnaire: {
    name: string;
    url: string;
    version: string;
  };
  createdAt: string;
  programName: string;
  /**
   * Date for which this response was expected
   */
  effectiveDate?: string;
  isSkipped?: boolean;
  context?: ResponseContext;
}

export type ResponseValue = { value: string; system?: string; display?: string };
/**
 * Context for the questionnaire response, which can be used to provide dynamic content in the questionnaire.
 *
 * This is a map of placeholder keys to their values. Questions in a questionnaire can reference these context values
 * using the syntax {{key}}. For example, if the context contains { "name": "Alice" }, a question could include
 * the text "Hello {{name}}!" which would be rendered as "Hello Alice!".
 */
export type ResponseContext = {
  [key: string]: string;
};

export type QuestionInputType =
  | 'decimal'
  | 'date'
  | 'year'
  | 'single-select'
  | 'multi-select'
  | 'scale-ordinal'
  | 'scale-numeric'
  | 'string'
  | 'text'
  | 'geo-location'
  | 'list'
  | 'country'
  | 'postal-code'
  | 'group'
  | 'display';
