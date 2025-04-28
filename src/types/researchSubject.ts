/**
 * See: https://build.fhir.org/valueset-research-subject-state.html
 */
export type ResearchSubjectProgressState =
  | 'candidate'
  | 'eligible'
  | 'follow-up'
  | 'ineligible'
  | 'not-registered'
  | 'off-study'
  | 'on-study'
  | 'on-study-intervention'
  | 'on-study-observation'
  | 'pending-on-study'
  | 'potential-candidate'
  | 'screening'
  | 'withdrawn';

export type ResearchSubjectProgress = {
  state: ResearchSubjectProgressState;
  date?: string;
};

export interface ResearchSubject {
  /**
   * See: https://build.fhir.org/researchsubject.html#statemachine
   * Flow:
   * 1.   "candidate"  Registered with donation service but not consented
   * With eligibility test
   * 2.   "screening"       Consented but eligibility test not completed
   * 3.   "eligible"        If eligible after eligibility test
   * 3.1  "on-study"        After passing eligibility test
   * 4.   "ineligible"      If ineligible after eligibility test
   * 4.1  "off-study"       After failing eligibility test and leaving the study while revoking consent
   *
   * Without eligibility test
   * 2.   "on-study"        Consented
   * 3.   "off-study"       When leaving the study an revoking consent
   */
  progress: ResearchSubjectProgress[];
  /**
   * The name of the program to which this ResearchSubject belongs
   */
  programName: string;
  /**
   * Information about the user, i.e anonymous or the token
   */
  subject: string;
}
