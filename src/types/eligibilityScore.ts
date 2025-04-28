export interface EligibilityScore {
  /**
   * The actual survey name
   */
  surveyName: string;
  /**
   * The actual eligibility score
   */
  value: number;
  /**
   * The maximum eligibility score
   */
  max: number;
}
