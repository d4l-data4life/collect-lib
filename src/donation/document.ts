import { blurDocument } from './blurring';
import { DonationRecord, ProgramDonation, RecordState } from './types';

export const StudyNameSystem = 'http://fhir.data4life.care/r5/CodeSystem/study-name';

/**
 * Filter a given list of records according to the program definition
 * @param records The records to filter
 * @param programName The name of the program
 * @param donation The donation configuration of the program
 * @returns A list of filtered records
 */
export const filterRecords = (
  records: DonationRecord[],
  programName: string,
  donation: ProgramDonation
): DonationRecord[] => {
  return records
    .filter(
      (record) =>
        record.status === RecordState.DELETED || isValidDocument(record.document, programName)
    )
    .map((record) => {
      const blurredDocument = blurDocument(
        record.document as fhir5.Resource,
        donation.anonymization
      );
      return {
        document: blurredDocument,
        status: record.status,
        id: record.id,
      };
    });
};

/**
 *
 * @param document An unknown document to validate
 * @param programName The name of the program
 * @param programResources The program resources
 * @returns True, if the document is valid. Otherwise, false.
 */
export const isValidDocument = (document: unknown, programName: string): boolean => {
  if (typeof document !== 'object' || document === null) {
    return false;
  }

  // Check if the document is a QuestionnaireResponse
  if (isQuestionnaireResponse(document)) {
    const questionnaireResponse = document as fhir5.QuestionnaireResponse;
    return hasValidItems(questionnaireResponse);
  }

  // Check if the document is a ResearchSubject
  if (isResearchSubject(document) && programName) {
    return isAllowedResearchSubject(document as fhir5.ResearchSubject, programName);
  }

  if (isObservation(document)) {
    return true;
  }

  if (isConsent(document)) {
    return true;
  }

  if (isRecording(document)) {
    return true;
  }

  if (isCommunication(document)) {
    return true;
  }

  return false;
};

/**
 * Checks if a document is a FHIR QuestionnaireResponse
 * @param document The document to check
 */
export const isQuestionnaireResponse = (
  document: unknown
): document is fhir5.QuestionnaireResponse =>
  (document as fhir5.QuestionnaireResponse).resourceType === 'QuestionnaireResponse';

/**
 * Checks if a document is a FHIR ResearchSubject
 * @param document The document to check
 */
export const isResearchSubject = (document: unknown): document is fhir5.ResearchSubject =>
  (document as fhir5.ResearchSubject).resourceType === 'ResearchSubject';

/**
 * Checks if a document is a FHIR Observation
 * @param document The document to check
 */
const isObservation = (document: unknown): document is fhir5.Observation =>
  (document as fhir5.Observation).resourceType === 'Observation';

/**
 * Checks if the document is a FHIR Consent
 * @param document The document to check
 */
const isConsent = (document: unknown): document is fhir5.Consent =>
  (document as fhir5.Consent).resourceType === 'Consent';

/**
 * Checks if a document is a FHIR Bundle (used for recordings)
 * @param document The document to check
 */
const isRecording = (document: unknown): document is fhir5.Bundle =>
  (document as fhir5.Bundle)?.resourceType === 'Bundle'; // TODO improve this check to narrow it further down

/**
 * Checks if a document is a FHIR Communication
 * @param document The document to check
 */
const isCommunication = (document: unknown): document is fhir5.Communication =>
  (document as fhir5.Communication)?.resourceType === 'Communication';

const isAllowedResearchSubject = (
  document: fhir5.ResearchSubject,
  programName: string
): boolean => {
  if (!document.study || !document.subject || !document.study.identifier) {
    return false;
  }

  if (document.study.identifier.system !== StudyNameSystem) {
    return false;
  }

  if (document.study.identifier.value !== programName) {
    return false;
  }
  return true;
};

/**
 * Filter out ResearchSubjects out of a list of records
 * @param records A set of records that should be donated
 * @returns An array of ResearchSubjects
 */
export const includedResearchSubjects = (
  records: { id: string; document: fhir5.Resource; status: RecordState }[]
): { id: string; document: fhir5.Resource; status: RecordState }[] => {
  return records.filter((record) => isResearchSubject(record.document));
};

const hasValidItems = (document: fhir5.QuestionnaireResponse): boolean =>
  Array.isArray(document.item) &&
  document.item.every((value: fhir5.QuestionnaireResponseItem) => {
    const validKeys = Object.keys(value).every((key: string) =>
      ['linkId', 'text', 'answer', 'item'].includes(key)
    );
    if (!validKeys) {
      return false;
    }

    // Answers/Items are not required
    if (value.answer || value.item) {
      return Array.isArray(value.answer || value.item);
    }
    return true;
  });
