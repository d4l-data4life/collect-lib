import { ProgramDevice, RecursiveKeyOf, TranslatedString } from '.';

export type SkippedStep = {
  programName: string;
  stepType: ProgramStepType;
  stepInfo: string;
  createdAt: string;
  updatedAt: string;
};

// ### Program
// Properties | Required | Type | Description
export type Program = {
  // name | true | string | Name of the program used as primary identifier
  name: string;
  // tenantID | true | string | Tenant the program belongs to
  tenantID: string;
  // languages | true | string[] | Language codes that the program is available in. Example: `['en', 'de']`
  languages: string[];
  // type | true | `study` or `sensor` | `sensor` is the new research-studio type, `study` is from the study-builder (and older)
  type: ProgramType;
  // phases | true | [ProgramStep](#ProgramStep)[][] | Defines the flow of the program as an array of `phases`. `phases` consist of arrays of `steps`. `phases` are worked through sequentially and `steps` within a single `phase` are parallel.
  phases: ProgramStep[][];
  // donation | true | [ProgramDonation](#ProgramDonation) | Donation settings handle which resources are donated, where they are donated to, and how the donation is regulated
  donation: ProgramDonation;
  // content | true | string | Contains all the relevant content properties of the program.
  content: ProgramContent;
  // endDate | false | ISO 8601 date with timezone | Date the program should finish for all users.
  endDate?: string;
  // tags | false | [ProgramTag](#ProgramTag)[] | List of supported tags including their configuration
  tags?: ProgramTag[];
  // publishedAt | true | ISO 8601 date with timezone | Date the program was published (used to determine program state).
  publishedAt?: string;
};

export type ProgramType = 'study' | 'sensor';

// ### ProgramSteps

// #### Base
// Properties | Required | Type | Description
export type ProgramStepBase = {
  // type | true | string | Defines the type of the step (determines which other attributes are applicable)
  type: ProgramStepType;
  // required | true | boolean | Defines if the step needs to be completed for the containing phase to count as completed
  required: boolean;
  // start | false | [StepCondition](#StepCondition) | Defines condition that starts the step. Using this condition with a survey means there will be an indiviual starting date for each user.
  start?: StepCondition;
  // end | false | [StepCondition](#StepCondition) | Defines condition that ends the step. Using this condition with a survey means there will be an indiviual ending date for each user.
  end?: StepCondition;
  // requiredCondition | false | [StepCondition](#StepCondition) | Defines condition that overwrites the required property with the evaluation result.
  requiredCondition?: StepCondition;
};

export type ProgramStepType =
  | 'consent'
  | 'token'
  | 'survey'
  | 'routine'
  | 'display'
  | 'eligibility'
  | 'sensor';

export type ProgramStep =
  | ProgramConsentStep
  | ProgramTokenStep
  | ProgramSurveyStep
  | ProgramDisplayStep
  | ProgramEligibilityStep
  | ProgramSensorStep
  | ProgramRoutineStep;

// #### Consent Step
// Properties | Required | Type | Description
export type ProgramConsentStep = ProgramStepBase & {
  // type | true | `consent` | Step that requires a consent to be given
  type: 'consent';
  // consentKey | true | string | Identifies which consent this step refers to
  consentKey: string;
  // minVersion | false | number | Denotes the minimum version of the consent which needs to be accepted
  minVersion?: number;
};

// #### Token Step
// Properties | Required | Type | Description
export type ProgramTokenStep = ProgramStepBase & {
  // type | true | `token` | Step that requires a token (participation code) to be entered
  type: 'token';
  // tokenLength | true | number | number of characters in the token
  tokenLength: number;
};

// #### Survey Step
// Properties | Required | Type | Description
export type ProgramSurveyStep = ProgramStepBase & {
  // type | true | `survey` | Step that requires a survey to be answered at least once
  type: 'survey';
  // surveyName | true | string | Identifies which survey this step refers to
  surveyName: string;
  // standalone | false | boolean | Denotes if this survey is a standalone survey that does not belong to this program specifically.
  standalone?: boolean;
};

// #### Routine Step
// Properties | Required | Type | Description
export type ProgramRoutineStep = ProgramStepBase & {
  // type | true | `routine` | Step that requires a routine to be executed at least once
  type: 'routine';
  // routineName | true | string | Identifies which routine this step refers to
  routineName: string;
};

// #### Display Step
// Properties | Required | Type | Description
export type ProgramDisplayStep = ProgramStepBase & {
  // type | true | `display` | Step that requires a display to be shown
  type: 'display';
  // displayName | true | string | Identifies which display this step refers to
  displayName: string;
  // isCompleted | false | boolean | If true marks the program as completed once this step is shown.
  isCompleted?: boolean;
};

// #### Eligibility Step
// Properties | Required | Type | Description
export type ProgramEligibilityStep = ProgramStepBase & {
  // type | true | `eligbility` | Step that requires an eligibility test to be passed
  type: 'eligibility';
  // surveyName | true | string | Identifies which survey is asked for eligibility determination
  surveyName: string;
  // threshold | true | [Threshold](#Threshold) | required for type `eligibility` - Defines the score condition that must be fulfilled to pass the eligibility test.
  threshold: Threshold;
  // standalone | false | boolean | Denotes if the survey for this eligbility step is one that does not belong to this program specifically.
  standalone?: boolean;
};

// ##### Threshold
// Properties | Required | Type | Description
export type Threshold = {
  // operator | true | `exists`, `eq`, `neq`, `lt`, `lteq`, `gt`, `gteq` | Defines the operator to use for the threshold
  operator: ComparisonOperator;
  // value | true | number | Defines the number to be used with the operator to define the threshold
  value: number;
};

export type ComparisonOperator = 'exists' | 'eq' | 'neq' | 'gt' | 'lt' | 'gteq' | 'lteq'

// #### Sensor Step
// Properties | Required | Type | Description
export type ProgramSensorStep = ProgramStepBase & {
  // type | true | `sensor` | Step that sets up passive data collection
  type: 'sensor';
  // devices | true | [ProgramDevices](#ProgramDevices)[] | List of supported devices including their configuration for passive data collection
  devices: ProgramDevice[];
};

// ### StepCondition
// Properties | Required | Type | Description
export type StepCondition = {
  // type | true | [ConditionType](#ConditionType) | Type of the condition (determines which other attributes are applicable)
  type: ConditionType;
  // surveyName | false | string | required for condition type `survey` and `question`
  surveyName?: string;
  // routineName | false | string | required for condition type `routine`
  routineName?: string;
  // linkID | false | string | required for condition type `question`
  linkID?: string;
  // questionType | false | `coding`, `date` | required for condition type `question` - defines the data type of the referred to question
  questionType?: ConditionQuestionType;
  // operand | false | string | required for condition type `question` (unless operator is `exists`). Used as `<answer>` `<operator>` `<operand>`.
  operand?: string;
  // operator | false | `exists`,`=`,`!=`,`>`,`<`,`>=`,`<=` | Required for condition type `question`. Used as `<answer>` `<operator>` `<operand>`.
  operator?: ConditionOperatorType;
  // offset | false | ISO 8601 duration string | Defines the offset between the answer date and the current date. For question type `coding` only impacts the start/end date calculation. For type `offset` impacts the `item`. For type `consent`, this is applied to the date of the consent grant
  offset?: string;
  // item | false | StepCondition | Required for condition type `not` and `offset`.
  item?: StepCondition;
  // items | false | StepCondition[] | Required for condition type `and` and `or`. List of conditions that are combined with the respective operator.
  items?: StepCondition[];
  // sorting | false | `earliest`, `latest` | Used for condition type `and` and `or`. Determines which resulting dates of the items gets picked. Defaults to `earliest` for `or` and `latest` for `and`.
  sorting?: ConditionSorting;
  // consentKey | false | string | Required for condition type `consent`. Reference to the consent that must have been granted to fulfill the condition.
  consentKey?: string;
};

// #### ConditionType
// Type | Description
export type ConditionType =
  // question | Condition that requires a specific answer from a previous survey
  | 'question'
  // survey | Condition that requires a previous survey to have been completed
  | 'survey'
  // routine | Condition that requires a previous routine to have been completed
  | 'routine'
  // and | Condition that requires all subconditions to be fulfilled
  | 'and'
  // or | Condition that requires one subcondition to be fulfilled
  | 'or'
  // offset | Condition that adds a date offset to the fulfillment date of the given subcondition
  | 'offset'
  // consent | Condition that require a specific consent to be given
  | 'consent';

export type ConditionQuestionType = 'coding' | 'date';
export type ConditionOperatorType = fhir5.QuestionnaireItemEnableWhen['operator'];
export type ConditionSorting = 'earliest' | 'latest';

// ### ProgramDonation
// Properties | Required | Type | Description
export type ProgramDonation = {
  // donation.consentKey | false | string | The consent key identifying the consent the user has to sign for data donation in this program.
  consentKey?: string;
  // donation.delay | true | number | The number of days after which a resource can be donated.
  delay: number;
  // donation.revocation | true | `delete`, `anonymize` | Determines what happens to the data after donation was revoked. Defaults to `delete`.
  revocation: 'delete' | 'anonymize';
  // donation.anonymization | false | [ProgramAnonymization](#ProgramAnonymization) | The set of the anonymization functions which should be applied to all resources of the program.
  anonymization?: ProgramAnonymization;
  // donation.target | true | string | The target which should be used for data donation.
  target: string;
};

// #### ProgramAnonymization
// Properties | Required | Type | Description
export type ProgramAnonymization = {
  // blur | false | object | The set of blurring settings that should be applied to the resource.
  blur?: {
    // blur.location | true | string | The timezone location of the resource, e.g `"Europe/Berlin"`.
    location: string;
    // blur.authored | false | [DateBlurringFunction](#DateBlurringFunction) | The name of the default blurring function which is used to blur the authored timestamp of every QuestionnaireResponse.
    authored?: DateBlurringFunction;
    // blur.authored | false | [DateBlurringFunction](#DateBlurringFunction) | The name of the default blurring function which is used to blur the period start and end of every ResearchSubject.
    researchSubject?: DateBlurringFunction;
  };
};

// #### DateBlurringFunction
// Type | Description
export type DateBlurringFunction =
  // startOfDay | Sets time to the start of the day (00:00:00)
  | 'startOfDay'
  // endOfDay | Sets time to the end of the day (23:59:59.99...)
  | 'endOfDay'
  // startOfWeek | Sets date to the start of monday
  | 'startOfWeek'
  // endOfWeek | Sets date to the end of sunday
  | 'endOfWeek'
  // startOfMonth | Sets date to the start of the first of the month
  | 'startOfMonth'
  // endOfMonth | Sets date to the end of the last of th month
  | 'endOfMonth';

// #### ProgramContent
// Properties | Required | Type | Description
export type ProgramContent = {
  // title | true | {language: string} | Display title of the program.
  title: TranslatedString;
  // description | true | {language: string} | Display description of the program.
  description: TranslatedString;
  // contact | true | {language: string} | Contact information to display for the user.
  contact: TranslatedString;
  // image | false | data URI encoded svg | Image of the program
  image?: string;
  // privacyPolicy | false | object | requires `text`
  privacyPolicy?: {
    text: TranslatedString;
  };
  // participationInformation | false | object | requires `text`
  participationInformation?: {
    text: TranslatedString;
  };
  // eligibility | false | object | requires `title`, `description`, `include` and `exclude`
  eligibility?: {
    title: TranslatedString;
    description: TranslatedString;
    include: TranslatedString;
    exclude: TranslatedString;
  };
};

export type ProgramContentPath = RecursiveKeyOf<ProgramContent>;

// #### ProgramTag
// Properties | Required | Type | Description
export type ProgramTag = {
  // code | true | string | The code identifying this tag
  code: string;
  // labels | true | TranslatedString | Set of human readable translations for this tag
  labels: TranslatedString;
  // effectiveType | true | 'dateTime', 'period' or 'unknown' | The type of tag
  effectiveType: TagEffectiveType;
};

export enum TagEffectiveType {
  DATE_TIME = 'dateTime',
  PERIOD = 'period',
  UNKNOWN = 'unknown',
}
