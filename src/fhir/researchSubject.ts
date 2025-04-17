import { ResearchSubjectProgressState, StudyNameSystem, TokenNamingSystem } from './constants';

type ResearchSubjectProgress = {
  state: ResearchSubjectProgressState;
  date?: string;
};

export const generateFHIRResearchSubject = (
  programName: string,
  progress: ResearchSubjectProgress[],
  subject: string = 'anonymous'
) => {
  const document: fhir5.ResearchSubject = {
    resourceType: 'ResearchSubject',
    status: 'active',
    progress: progressToFHIR(progress),
    subject: {
      identifier: {
        system: TokenNamingSystem,
        value: subject,
      },
    },
    study: {
      identifier: {
        system: StudyNameSystem,
        value: programName,
      },
    },
    period: getPeriod(progress),
  };
  return document;
};

const progressToFHIR = (progress: ResearchSubjectProgress[]): fhir5.ResearchSubjectProgress[] => {
  const fhirProgress: fhir5.ResearchSubjectProgress[] = [];
  let endDate;
  // Iterate over the progress in reverse order to add the endDate
  for (let i = progress.length - 1; i >= 0; i--) {
    const phase = progress[i];
    fhirProgress.push({
      subjectState: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/research-subject-state',
            code: phase.state,
          },
        ],
      },
      startDate: phase.date,
      ...(endDate && { endDate }),
    });
    endDate = phase.date;
  }
  return fhirProgress.reverse();
};

const getPeriod = (progress: ResearchSubjectProgress[]): fhir5.Period => {
  const lastProgress = progress.at(-1);
  return {
    start: progress[0].date,
    ...(lastProgress &&
      lastProgress.state === ResearchSubjectProgressState.OFF_STUDY && { end: lastProgress.date }),
  };
};
