export interface QuestionnaireScore {
  /**
   * The actual survey name
   */
  questionnaireName: string;
  /**
   * The actual score
   */
  value: number;
  /**
   * The minimum score
   */
  min: number;
  /**
   * The maximum score
   */
  max: number;
  /**
   * The id of the QuestionnaireResponse this score is derived from (if none, then it is assumed to be a study eligibility score)
   */
  derivedFrom?: string;
}
