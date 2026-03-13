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
}

export type ResponseValue = { value: string; system?: string; display?: string };

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
  | 'list';
