import { RecursiveKeyOf, TranslatedString } from '.';

export type Answer = string | string[];
export type Answers = { [key: string]: Answer };
export type MultiAnswers = { [key: string]: { date: Date | null; answers: Answers } };

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
  // reminder | false | [TaskReminder](#TaskReminder) | Defines if and when a reminder should be sent for the task (only for one-time and recurring tasks)
  reminder?: TaskReminder;
  // template | false | string | Name of the template used for the questionnaire (templated surveys don't allow questions to be changed)
  template?: string;
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
  // location | false | Timezone Location | Determines the location for the defined date, so that timezone problems can be handled.
  location?: string;
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

// #### TaskReminder
// Properties | Required | Type | Description
export type TaskReminder = {
  // frequency | true | [ReminderFrequencyType](#ReminderFrequencyType) | Defines if and when a reminder should be sent for the task (only for one-time and recurring tasks)
  frequency: ReminderFrequencyType;
};

// #### SurveyScoring
// Properties | Required | Type | Description
export type SurveyScoring = {
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

// #### ReminderFrequencyType
// Type | Description
export type ReminderFrequencyType =
  // daily | A reminder will be sent daily
  | 'daily'
  // beforeExpiry | A reminder will be sent when the task is about to expire (last day it is available)
  | 'beforeExpiry';

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

export type SurveyContentPath = RecursiveKeyOf<SurveyContent>;
