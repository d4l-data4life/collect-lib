import { RecursiveKeyOf, TranslatedString } from '.';

export type ScalarAnswer = string;
export type ArrayAnswer = string[];
export type GeoLocationAnswer = [string, string];
export type MatrixAnswer = Record<string, string>;
export type FlatAnswer = string | string[];
export type Answer = FlatAnswer | MatrixAnswer;
export type Answers = Record<string, Answer>;

export function isScalarAnswer(answer: Answer | undefined): answer is ScalarAnswer {
  return typeof answer === 'string';
}

export function isArrayAnswer(answer: Answer | undefined): answer is ArrayAnswer {
  return Array.isArray(answer);
}

export function isGeoLocationAnswer(answer: Answer | undefined): answer is GeoLocationAnswer {
  return Array.isArray(answer) &&
    answer.length === 2 &&
    [answer[0], answer[1]].every((s): s is string => Number.isFinite(Number(s)));
}

export function isMatrixAnswer(answer: Answer | undefined): answer is MatrixAnswer {
  return typeof answer === 'object' && answer !== null && !Array.isArray(answer);
}

export function isFlatAnswer(answer: Answer | undefined): answer is FlatAnswer {
  return typeof answer === 'string' || Array.isArray(answer);
}

export type MultiAnswers = { [key: string]: { date: Date | null; answers: Answers } };
export type CopyrightLabel = { [key: string]: string };

// ### Survey
// Properties | Required | Type | Description
export type Survey = {
  // name | true | string | Primary identifier. Assumption: survey and routine names are collectively unique
  name: string;
  // programName | true | string | The name of the program the survey belongs to
  programName: string;
  // frequency | true | [TaskFrequency](#TaskFrequency) | Defines in which frequency the questionnaire occurs
  frequency: TaskFrequency;
  // scoring | true | [SurveyScoring](#SurveyScoring) | Defines the texts, images and icons that need to be displayed for the survey
  scoring?: SurveyScoring;
  // content | true | [SurveyContent](#SurveyContent) | Defines the texts, images and icons that need to be displayed for the survey
  content: SurveyContent;
  // template | false | string | Name of the template used for the questionnaire (templated surveys don't allow questions to be changed)
  template?: string;
  // publishedAt | false | ISO 8601 date with timezone | Date the survey was published.
  publishedAt?: string;
  // multiplex | false | [SurveyMultiplex](#SurveyMultiplex) | Configures that this survey will be answered multiple times per window based on the answers of another questionnaire.
  multiplex?: SurveyMultiplex;
  // copyrightLabel | false | CopyrightLabel | Optional copyright/trademark text shown on questionnaire screens
  copyrightLabel?: CopyrightLabel;
  // withheld | true | boolean | If true, the survey will not be published yet
  withheld: boolean;
};

// #### TaskFrequency
// Properties | Required | Type | Description
export type TaskFrequency = {
  // type | true | [FrequencyType](#FrequencyType) | Defines how often and when a questionnaire is triggered/added for the survey
  type: FrequencyType;
  // start | true | ISO 8601 date with timezone | Determines the global starting date of the survey. The time component is also used for when the events should be available on the day they become available.
  start: string;
  // end | false | ISO 8601 date with timezone | Determines the global ending date of the survey.
  end?: string;
  // factor | false | integer | For `daily`, `weekly` and `monthly` this factor is used to manipulate the cycle length, e.g. `daily` with a factor of 7 makes it a survey that is repeated every week, but doesn't necessarily start on monday.
  factor?: number;
  // editDuration | false | ISO 8601 duration string | Enables editing events of this survey for the given duration.
  editDuration?: string;
  // skipFirst | false | boolean | Determines if the first iteration of the survey after subscription should be skipped. Skipping it means the questionnaire won't open in the middle of the window and instead at the start of the next full window. Defaults to `false`.
  skipFirst?: boolean;
  // retainCTAs | false | number | Allows configuring that x amount of previous CTAs remain active on the todo screen.
  retainCTAs?: number;
  // allowAddOnDemand | false | boolean | If true allows the task to also be added at any point in time (on demand).
  allowAddOnDemand?: boolean;
};

// #### SurveyScoring
// Properties | Required | Type | Description
export type SurveyScoring = {
  // eligibility | false | boolean | Indicates if the scoring is suitable for eligibility.
  eligibility?: boolean;
  // scores | true | object | Defines how the questions will be scored
  scores: {
    // scores.valueset | false | {valuesetURL: {answerCode: score}} | For questions that use valuesets scores are assigned to each code of the valuesets
    valueset?: { [valuesetURL: string]: { [answerCode: string]: number } };
    // scores.number | false | {linkId: [ScoreThreshold](#ScoreThreshold)[]} | For numeric questions we define scoring conditions per question
    number?: { [questionLinkId: string]: ScoreThreshold[] };
  };
};

// #### ScoreThreshold
// Properties | Required | Type | Description
export type ScoreThreshold = {
  // operator | true | `eq`, `lt`, `lteq`, `gt`, `gteq` | Defines the operator to use with the threshold
  operator: string;
  // threshold | true | number | Threshold that is used with the operator
  threshold: number;
  // score | true | number | Score that is added when the operator and threshold condition is met
  score: number;
};

// #### FrequencyType
// Type | Description
export type FrequencyType =
  // single | Occurs only once
  | 'single'
  // daily | Occurs every day
  | 'daily'
  // weekly | Occurs every Monday
  | 'weekly'
  // monthly | Occurs every 1st of a month
  | 'monthly'
  // onDemand | There is a button that allows you to add one at any point
  | 'onDemand';

// #### SurveyContent
// Properties | Required | Type | Description
export type SurveyContent = {
  // default | true | object | Default values for survey texts and images
  default: {
    // default.title | true | {[language]: text} | Survey title in available languages
    title: TranslatedString;
    // default.description | false | {[language]: text} | Survey description in available languages
    description?: TranslatedString;
    // default.image | false | data URI encoded svg | Survey image in html usable format
    image?: string;
    // default.icon | false | data URI encoded svg | Survey icon in html usable format
    icon?: string;
  };
};

// #### SurveyMultiplex
// Properties | Required | Type | Description
export type SurveyMultiplex = {
  // source | true | object | Defines the source of the multiplexing. The keys of the object are the questionnaire names and the values are the linkIds of the questions whose answers will be used for multiplexing. The answers to these questions will be used to fill the placeholder.
  source: { [key: string]: string[] };
  // lookup | true | `all` or `latest` | Defines how the answers of the source questions will be looked up. `latest` means only the latest iteration of the source questionnaires will be used, `all` means all iterations of the source questionnaires will be used.
  lookup: 'all' | 'latest';
  // placeholder | true | string | Placeholder text to be replaced with answers from the specified linkIds
  placeholder: string;
};

export type SurveyContentPath = RecursiveKeyOf<SurveyContent>;
