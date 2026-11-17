// Entry for the Go package pkg/guard (see README_GO.md). Guards are objects with methods that
// work on Dates, and neither can cross the JSON boundary to Go, so Go calls this function.
import { Settings } from 'luxon';
import { generateStepGuard } from '../helper/guard';
import { Answers, StepCondition } from '../types';

// goja has no Intl. luxon only needs it to look up the system locale, so set one.
Settings.defaultLocale = 'en-US';

type Times = { [key: string]: string | null };

export type StepParams = {
  multiAnswers?: { [surveyName: string]: { date: string | null; answers: Answers } };
  consentTimes?: Times;
  routineTimes?: Times;
  responseTimes?: Times;
};

const toDate = (iso: string | null) => (iso === null ? null : new Date(iso));

const mapValues = <A, B>(obj: { [key: string]: A } | undefined, f: (a: A) => B) => {
  if (!obj) return undefined;
  const out: { [key: string]: B } = {};
  for (const key of Object.keys(obj)) out[key] = f(obj[key]);
  return out;
};

// When the step condition counts as fulfilled (ISO 8601), or null if it isn't.
export const stepFulfillmentDate = (cond: StepCondition, params: StepParams): string | null => {
  const date = generateStepGuard(cond).guard.getFulfillmentDate({
    multiAnswers: mapValues(params.multiAnswers, (s) => ({ date: toDate(s.date), answers: s.answers })),
    consentTimes: mapValues(params.consentTimes, toDate),
    routineTimes: mapValues(params.routineTimes, toDate),
    responseTimes: mapValues(params.responseTimes, toDate),
  });
  return date ? date.toISOString() : null;
};
