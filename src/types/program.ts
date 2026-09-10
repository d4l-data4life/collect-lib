import { ProgramDevice, RecursiveKeyOf, TranslatedString } from '.';
import { TrackingCategory } from '../tracking/types';

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
  // content | true | [ProgramContent](#ProgramContent) | Contains all the relevant content properties of the program.
  content: ProgramContent;
  // endDate | false | ISO 8601 date with timezone | Date the program should finish for all users.
  endDate?: string;
  // tags | false | [ProgramTag](#ProgramTag)[] | List of supported tags including their configuration
  tags?: ProgramTag[];
  // publishedAt | false | ISO 8601 date with timezone | Date the program was published (used to determine program state).
  publishedAt?: string;
  // featured | true | [ProgramFeatured](#ProgramFeatured) | Describes the featured state of the program.
  featured: ProgramFeatured;
  // theme | false | 'D4L', 'GREEN', 'PURPLE', 'OLIVE' or 'BLUE' | The theme to be used for the program in the app
  theme?: 'D4L' | 'GREEN' | 'PURPLE' | 'OLIVE' | 'BLUE';
  // appVersion | false | object | Minimum smartphone app version required to run this program. When the installed app is below `version`, the program update is withheld and the user is asked to update. `version` and `androidVersionCode` must describe the same app release.
  appVersion?: ProgramAppVersion;
  // tracking | false | [ProgramTracking](#ProgramTracking) | BI event tracking configuration. When absent, tracking is off.
  tracking?: ProgramTracking;
};

// #### ProgramTracking
// BI event tracking is opt-in per program: no configuration means no tracking.
// Properties | Required | Type | Description
export type ProgramTracking = {
  // enabled | true | boolean | Master switch for BI event tracking in this program
  enabled: boolean;
  // categories | true | TrackingCategory[] | Event categories ('technical', 'task', 'engagement') that may be recorded
  categories: TrackingCategory[];
};

// #### ProgramAppVersion
// Minimum app version a program requires. `version` (semver / versionName) drives the runtime gate on both platforms and the iOS App Store availability check; `androidVersionCode` is the Play versionCode of that same release, used for the Android availability check (Play exposes only a version code, never a versionName).
// Properties | Required | Type | Description
export type ProgramAppVersion = {
  // version | true | semver string | e.g. "1.42.0"
  version: string;
  // androidVersionCode | true | number | Play versionCode of the same release
  androidVersionCode: number;
};

// #### ProgramFeatured
// Properties | Required | Type | Description
export type ProgramFeatured = {
  // enabled | true | boolean | Denotes if the program is featured
  enabled: boolean;
  // showProgramImage | false | boolean | Denotes if the program image should be shown
  showProgramImage?: boolean;
  // showInstituteImage | false | boolean | Denotes if the institute image should be shown
  showInstituteImage?: boolean;
  // showContactInformation | false | boolean | Denotes if the contact information should be shown
  showContactInformation?: boolean;
  // showSensors | false | boolean | Denotes if the sensors should be shown
  showSensors?: boolean;
  // estimatedEffort | false | object | The estimated effort for the program
  estimatedEffort?: {
    amount: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
    per: 'day' | 'week' | 'month' | 'year';
  };
  // description | false | TranslatedString | Shown as short description in featured listing (required if featured is enabled)
  description?: TranslatedString;
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

export type ComparisonOperator = 'exists' | 'eq' | 'neq' | 'gt' | 'lt' | 'gteq' | 'lteq';

// #### Sensor Step
// Properties | Required | Type | Description
export type ProgramSensorStep = ProgramStepBase & {
  // type | true | `sensor` | Step that sets up passive data collection
  type: 'sensor';
  // devices | true | [ProgramDevices](#ProgramDevices)[] | List of supported devices including their configuration for passive data collection
  devices: ProgramDevice[];
};

// ### StepCondition
export type StepCondition =
  | DateCondition
  | CodeQuestionCondition
  | DateQuestionCondition
  | SurveyCondition
  | RoutineCondition
  | ConsentCondition
  | ResponseCondition
  | AndCondition
  | OrCondition
  | OffsetCondition;

// #### Base
// Properties | Required | Type | Description
export type StepConditionBase = {
  // type | true | [ConditionType](#ConditionType) | Type of the condition (determines which other attributes are applicable)
  type: ConditionType;
  // offset | false | ISO 8601 duration string | Adds additional offset duration to conditions outcome. (e.g. x plus two days)
  offset?: string;
};

// #### DateCondition
// Properties | Required | Type | Description
export type DateCondition = StepConditionBase & {
  // type | true | `date` | Condition that requires a date to have passed
  type: 'date';
  // date | true | string (YYYY-MM-DD) | Timestamp that needs to be passed for the condition to be true.
  date: string;
};

// #### CodeQuestionCondition
// Properties | Required | Type | Description
export type CodeQuestionCondition = StepConditionBase & {
  // type | true | `question` | Condition that requires a specific answer from a previous survey
  type: 'question';
  // questionType | true | `coding` | Condition that uses authored date of the response fulfilling the code condition
  questionType: 'coding';
  // surveyName | true | string | Identifier of the survey
  surveyName: string;
  // linkID | true | string | Identifier of the question
  linkID: string;
  // operand | false | string | (unless operator is `exists`). Used as `<answer>` `<operator>` `<operand>`.
  operand?: string;
  // operator | true | `exists`,`=`,`!=`,`>`,`<`,`>=`,`<=` | Used as `<answer>` `<operator>` `<operand>`.
  operator: ConditionOperatorType;
};

// #### DateQuestionCondition
// Properties | Required | Type | Description
export type DateQuestionCondition = StepConditionBase & {
  // type | true | `question` | Condition that requires a specific answer from a previous survey
  type: 'question';
  // questionType | true | `date` | Condition that uses the answer of a date question as fulfillment date
  questionType: 'date';
  // surveyName | true | string | Identifier of the survey
  surveyName: string;
  // linkID | true | string | Identifier of the question
  linkID: string;
};

// #### SurveyCondition
// Properties | Required | Type | Description
export type SurveyCondition = StepConditionBase & {
  // type | true | `survey` | Condition that requires a previous survey to have been completed
  type: 'survey';
  // surveyName | true | string | Identifier of the survey
  surveyName: string;
};

// #### RoutineCondition
// Properties | Required | Type | Description
export type RoutineCondition = StepConditionBase & {
  // type | true | `routine` | Condition that requires a previous routine to have been completed
  type: 'routine';
  // routineName | true | string | Identifier of the routine
  routineName: string;
};

// #### ConsentCondition
// Properties | Required | Type | Description
export type ConsentCondition = StepConditionBase & {
  // type | true | `consent` | Condition that require a specific consent to be given
  type: 'consent';
  // consentKey | true | string | Reference to the consent that must have been granted to fulfill the condition.
  consentKey: string;
};

// #### ResponseCondition
// Properties | Required | Type | Description
export type ResponseCondition = StepConditionBase & {
  // type | true | `response` | Condition that require a specific response to be received
  type: 'response';
  // responseName | true | string | Reference to the response that must have been received to fulfill the condition.
  responseName: string;
};

// #### AndCondition
// Properties | Required | Type | Description
export type AndCondition = StepConditionBase & {
  // type | true | `and` | Condition that requires all subconditions to be fulfilled
  type: 'and';
  // items | true | StepCondition[] | List of conditions that must all be fulfilled.
  items: StepCondition[];
  // sorting | false | `earliest`, `latest` |  Determines which resulting dates of the items gets picked. Defaults to `latest`.
  sorting?: ConditionSorting;
};

// #### OrCondition
// Properties | Required | Type | Description
export type OrCondition = StepConditionBase & {
  // type | true | `or` | Condition that requires one subcondition to be fulfilled
  type: 'or';
  // items | true | StepCondition[] | List of conditions where at least one must be fulfilled.
  items: StepCondition[];
  // sorting | false | `earliest`, `latest` | Determines which resulting dates of the items gets picked. Defaults to `earliest`.
  sorting?: ConditionSorting;
};

// #### OffsetCondition
// Properties | Required | Type | Description
export type OffsetCondition = StepConditionBase & {
  // type | true | `offset` | Condition that adds a date offset to the fulfillment date of the given subcondition
  type: 'offset';
  // offset | true | ISO 8601 duration string | Offset as duration, can be negative.
  offset: string;
  // item | true | StepCondition | Condition to apply the additional offset to.
  item: StepCondition;
};

export type ConditionType =
  | 'date'
  | 'question'
  | 'survey'
  | 'routine'
  | 'and'
  | 'or'
  | 'offset'
  | 'consent'
  | 'response';

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
  // contactInfo | true | [ProgramContact](#ProgramContact) | Contact information to display for the user.
  contactInfo?: ProgramContact;
  // image | false | string | Image of the program
  image?: string;
  // institute | false | object | requires `name` if `image` is set
  institute?: {
    name?: TranslatedString;
    image?: string;
  };
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

// #### ProgramContact
// Properties | Required | Type | Description
export type ProgramContact = {
  // email | false | string | Email address to contact for questions.
  email?: string;
  // phone | false | string | Phone number to contact for questions.
  phone?: string;
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

export type TagEffectiveType = 'dateTime' | 'period' | 'unknown';
