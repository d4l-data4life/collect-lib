import { DateTime, DateTimeUnit } from 'luxon';
import { DateBlurringFunction, ProgramAnonymization } from '../types';
import { isQuestionnaireResponse, isResearchSubject } from './document';

/**
 *
 * @param document The FHIR document to blur
 * @param anonymization A set of anonymization options that should be applied to the FHIR document
 * @param preprocessing A set of preprocessing options that should be applied to the FHIR document and overwrite the options specified in `anonymization`
 * @returns If the FHIR document should be blurred, the blurred version of the FHIR document. Otherwise the original FHIR document.
 */
export const blurDocument = (
  document: fhir5.Resource,
  anonymization: ProgramAnonymization | undefined
): fhir5.Resource => {
  if (!anonymization || !document) {
    return document;
  }

  const blurredDocument = { ...document };
  if (isQuestionnaireResponse(blurredDocument)) {
    return blurQuestionnaireResponse(blurredDocument as fhir5.QuestionnaireResponse, anonymization);
  }

  if (isResearchSubject(blurredDocument)) {
    return blurResearchSubject(blurredDocument as fhir5.ResearchSubject, anonymization);
  }

  return { ...blurredDocument };
};

/**
 * Blur a QuestionnaireResponse
 * @param document The QuestionnaireResponse to blur
 * @param anonymization The anonymization to use
 * @param preprocessing The preprocessing options of the program
 * @returns The blurred QuestionnaireResponse
 */
const blurQuestionnaireResponse = (
  document: fhir5.QuestionnaireResponse,
  anonymization: ProgramAnonymization
): fhir5.QuestionnaireResponse => {
  // Default blurring which applies to all resources of the program
  const blur = anonymization?.blur;

  if (blur) {
    return {
      ...document,
      ...(document.authored && {
        authored: blurAuthored(document.authored, blur.authored, blur.location),
      }),
    };
  }
  return document;
};

/**
 * Blur a ResearchSubject
 * @param document The ResearchSubject to blur
 * @param anonymization The anonymization to use
 * @returns The blurred ResearchSubject
 */
const blurResearchSubject = (
  document: fhir5.ResearchSubject,
  anonymization: ProgramAnonymization
): fhir5.ResearchSubject => {
  const programBlur = anonymization?.blur;

  if (programBlur && programBlur.researchSubject) {
    const blurredPeriod = blurPeriod(
      document.period,
      programBlur.researchSubject,
      programBlur.location
    );
    return {
      ...document,
      ...(blurredPeriod && { period: blurredPeriod }),
    };
  }
  return document;
};

/**
 * Blur the `authored` date of the QuestionnaireResponse
 * @param authored The time when the QuestionnaireResponse was authored
 * @param blur The function that should be used for blurring
 * @param location The location of the authored date
 * @returns The blurred authored string
 */
const blurAuthored = (
  authored: string,
  blurFn: DateBlurringFunction | undefined,
  location: string | undefined
): string => {
  if (!location || !blurFn) {
    return authored;
  }
  const authoredDate = DateTime.fromISO(authored).setZone(location);
  if (!authoredDate || !authoredDate.isValid) {
    return authored;
  }
  return blurDate(authoredDate, blurFn).toString();
};

/**
 * Blur a period with a specific blurring function
 * @param period The period to blur
 * @param blurFn The blurring function to apply
 * @param location The location to which the period is assigned
 * @returns The blurred period
 */
const blurPeriod = (
  period: { start?: string; end?: string } | undefined,
  blurFn: DateBlurringFunction,
  location: string
): { start?: string; end?: string } | undefined => {
  if (!period) {
    return undefined;
  }

  const startDate = period.start ? DateTime.fromISO(period.start).setZone(location) : undefined;
  const endDate = period.end ? DateTime.fromISO(period.end).setZone(location) : undefined;

  return {
    ...(period.start &&
      (startDate && startDate.isValid
        ? { start: blurDate(startDate, blurFn).toString() }
        : { start: period.start })),
    ...(period.end &&
      (endDate && endDate.isValid
        ? { end: blurDate(endDate, blurFn).toString() }
        : { end: period.end })),
  };
};

/**
 * Blur a date with a specific blurring function
 * @param date The date to blur
 * @param blurFn The blurring function to apply
 * @returns The blurred date
 */
const blurDate = (date: DateTime, blurFn: DateBlurringFunction): DateTime => {
  const [fn, unit] = blurFn.toLowerCase().split('of') as [string, DateTimeUnit];
  if (!['day', 'week', 'month'].includes(unit)) {
    return date;
  }
  if (fn === 'start') {
    return date.startOf(unit);
  } else if (fn === 'end') {
    return date.endOf(unit);
  }
  return date;
};
