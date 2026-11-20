# collect-lib

Library for reusable functionality of collect (phoenix and research-studio)

## Local Development

Build the app using `yarn build` or start development mode using `yarn start`

### Phoenix

For pure coding `yarn link ../collect-lib` works fine, but execution will not work because of symlink issues.
Here we use the help of [yalc](https://github.com/wclr/yalc) (`npm -g install yalc`).
First run `yalc publish` in `collect-lib`, then `yalc link @d4l/collect-lib` in `phoenix`.
Then you can update the lib and then get it into the app with `yarn build && yalc push`

### Research Studio

```
pnpm add file:../collect-lib
```

After every change in the library a `pnpm install` has to be triggered for the changes to take effect in RS.

## Go module

collect-lib is also a Go module, `github.com/d4l-data4life/collect-lib`, so Go services can use selected functions without a Go port.
The TypeScript is bundled and run in-process with [goja](https://github.com/dop251/goja), a pure-Go JavaScript interpreter,
and the module is versioned with the same release tags as the npm package.

If you change TS code that a Go package wraps, commit the regenerated `pkg/*/bundle/` from
`yarn build` with it. If you bump `@d4l/grpc-modules`, bump its Go module to the same version.

See **[README_GO.md](README_GO.md)** for usage, how it works, and how to export another function.

## Types

The type documentation is generated automatically from the `src/types` files.
Update the types by running `yarn run readme:update`.

<!-- AUTOMATICALLY GENERATED CONTENT -->

### Program

| Properties  | Required | Type                                        | Description                                                                                                                                                                                                                                    |
| ----------- | -------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name        | true     | string                                      | Name of the program used as primary identifier                                                                                                                                                                                                 |
| tenantID    | true     | string                                      | Tenant the program belongs to                                                                                                                                                                                                                  |
| languages   | true     | string[]                                    | Language codes that the program is available in. Primary language is listed first. Example: `['en', 'de']`                                                                                                                                     |
| type        | true     | `study` or `sensor`                         | `sensor` is the new research-studio type, `study` is from the study-builder (and older)                                                                                                                                                        |
| phases      | true     | [ProgramStep](#ProgramStep)[][]             | Defines the flow of the program as an array of `phases`. `phases` consist of arrays of `steps`. `phases` are worked through sequentially and `steps` within a single `phase` are parallel.                                                     |
| donation    | true     | [ProgramDonation](#ProgramDonation)         | Donation settings handle which resources are donated, where they are donated to, and how the donation is regulated                                                                                                                             |
| content     | true     | [ProgramContent](#ProgramContent)           | Contains all the relevant content properties of the program.                                                                                                                                                                                   |
| endDate     | false    | ISO 8601 date with timezone                 | Date the program should finish for all users.                                                                                                                                                                                                  |
| tags        | false    | [ProgramTag](#ProgramTag)[]                 | List of supported tags including their configuration                                                                                                                                                                                           |
| publishedAt | false    | ISO 8601 date with timezone                 | Date the program was published (used to determine program state).                                                                                                                                                                              |
| featured    | true     | [ProgramFeatured](#ProgramFeatured)         | Describes the featured state of the program.                                                                                                                                                                                                   |
| theme       | false    | 'D4L', 'GREEN', 'PURPLE', 'OLIVE' or 'BLUE' | The theme to be used for the program in the app                                                                                                                                                                                                |
| appVersion  | false    | object                                      | Minimum smartphone app version required to run this program. When the installed app is below `version`, the program update is withheld and the user is asked to update. `version` and `androidVersionCode` must describe the same app release. |
| tracking    | false    | [ProgramTracking](#ProgramTracking)         | BI event tracking configuration. When absent, tracking is off.                                                                                                                                                                                 |
| byod        | false    | [ProgramSensorByod](#ProgramSensorByod)     | Whether participants can self-select which of their own compatible devices they want to use for the study. When absent, BYOD is off.                                                                                                           |

#### ProgramTracking

BI event tracking is opt-in per program: no configuration means no tracking.

| Properties | Required | Type               | Description                                                               |
| ---------- | -------- | ------------------ | ------------------------------------------------------------------------- |
| enabled    | true     | boolean            | Master switch for BI event tracking in this program                       |
| categories | true     | TrackingCategory[] | Event categories ('technical', 'task', 'engagement') that may be recorded |

#### ProgramSensorByod

| Properties    | Required | Type                              | Description                                                             |
| ------------- | -------- | --------------------------------- | ----------------------------------------------------------------------- |
| enabled       | true     | boolean                           | Master switch for participant device self-selection                     |
| selectionMode | true     | `single_select` or `multi_select` | Whether the participant can pick one device or several                  |
| allowNone     | true     | boolean                           | Whether "I don't own any of the listed devices" is offered as an option |

#### ProgramAppVersion

Minimum app version a program requires. `version` (semver / versionName) drives the runtime gate on both platforms and the iOS App Store availability check; `androidVersionCode` is the Play versionCode of that same release, used for the Android availability check (Play exposes only a version code, never a versionName).

| Properties         | Required | Type          | Description                          |
| ------------------ | -------- | ------------- | ------------------------------------ |
| version            | true     | semver string | e.g. "1.42.0"                        |
| androidVersionCode | true     | number        | Play versionCode of the same release |

#### ProgramFeatured

| Properties             | Required | Type             | Description                                                                      |
| ---------------------- | -------- | ---------------- | -------------------------------------------------------------------------------- |
| enabled                | true     | boolean          | Denotes if the program is featured                                               |
| showProgramImage       | false    | boolean          | Denotes if the program image should be shown                                     |
| showInstituteImage     | false    | boolean          | Denotes if the institute image should be shown                                   |
| showContactInformation | false    | boolean          | Denotes if the contact information should be shown                               |
| showSensors            | false    | boolean          | Denotes if the sensors should be shown                                           |
| estimatedEffort        | false    | object           | The estimated effort for the program                                             |
| description            | false    | TranslatedString | Shown as short description in featured listing (required if featured is enabled) |

### ProgramSteps

#### Base

| Properties        | Required | Type                            | Description                                                                                                                              |
| ----------------- | -------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| type              | true     | string                          | Defines the type of the step (determines which other attributes are applicable)                                                          |
| required          | true     | boolean                         | Defines if the step needs to be completed for the containing phase to count as completed                                                 |
| start             | false    | [StepCondition](#StepCondition) | Defines condition that starts the step. Using this condition with a survey means there will be an indiviual starting date for each user. |
| end               | false    | [StepCondition](#StepCondition) | Defines condition that ends the step. Using this condition with a survey means there will be an indiviual ending date for each user.     |
| requiredCondition | false    | [StepCondition](#StepCondition) | Defines condition that overwrites the required property with the evaluation result.                                                      |

#### Consent Step

| Properties | Required | Type      | Description                                                           |
| ---------- | -------- | --------- | --------------------------------------------------------------------- |
| type       | true     | `consent` | Step that requires a consent to be given                              |
| consentKey | true     | string    | Identifies which consent this step refers to                          |
| minVersion | false    | number    | Denotes the minimum version of the consent which needs to be accepted |

#### Token Step

| Properties  | Required | Type    | Description                                                   |
| ----------- | -------- | ------- | ------------------------------------------------------------- |
| type        | true     | `token` | Step that requires a token (participation code) to be entered |
| tokenLength | true     | number  | number of characters in the token                             |

#### Survey Step

| Properties | Required | Type     | Description                                                                                      |
| ---------- | -------- | -------- | ------------------------------------------------------------------------------------------------ |
| type       | true     | `survey` | Step that requires a survey to be answered at least once                                         |
| surveyName | true     | string   | Identifies which survey this step refers to                                                      |
| standalone | false    | boolean  | Denotes if this survey is a standalone survey that does not belong to this program specifically. |

#### Routine Step

| Properties  | Required | Type      | Description                                               |
| ----------- | -------- | --------- | --------------------------------------------------------- |
| type        | true     | `routine` | Step that requires a routine to be executed at least once |
| routineName | true     | string    | Identifies which routine this step refers to              |

#### Display Step

| Properties  | Required | Type      | Description                                                     |
| ----------- | -------- | --------- | --------------------------------------------------------------- |
| type        | true     | `display` | Step that requires a display to be shown                        |
| displayName | true     | string    | Identifies which display this step refers to                    |
| isCompleted | false    | boolean   | If true marks the program as completed once this step is shown. |

#### Eligibility Step

| Properties | Required | Type                    | Description                                                                                                        |
| ---------- | -------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| type       | true     | `eligbility`            | Step that requires an eligibility test to be passed                                                                |
| surveyName | true     | string                  | Identifies which survey is asked for eligibility determination                                                     |
| threshold  | true     | [Threshold](#Threshold) | required for type `eligibility` - Defines the score condition that must be fulfilled to pass the eligibility test. |
| standalone | false    | boolean                 | Denotes if the survey for this eligbility step is one that does not belong to this program specifically.           |

##### Threshold

| Properties | Required | Type                                              | Description                                                             |
| ---------- | -------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| operator   | true     | `exists`, `eq`, `neq`, `lt`, `lteq`, `gt`, `gteq` | Defines the operator to use for the threshold                           |
| value      | true     | number                                            | Defines the number to be used with the operator to define the threshold |

#### Sensor Step

| Properties | Required | Type                                | Description                                                                         |
| ---------- | -------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| type       | true     | `sensor`                            | Step that sets up passive data collection                                           |
| devices    | true     | [ProgramDevices](#ProgramDevices)[] | List of supported devices including their configuration for passive data collection |

### StepCondition

#### Base

| Properties | Required | Type                            | Description                                                                   |
| ---------- | -------- | ------------------------------- | ----------------------------------------------------------------------------- |
| type       | true     | [ConditionType](#ConditionType) | Type of the condition (determines which other attributes are applicable)      |
| offset     | false    | ISO 8601 duration string        | Adds additional offset duration to conditions outcome. (e.g. x plus two days) |

#### DateCondition

| Properties | Required | Type                | Description                                                     |
| ---------- | -------- | ------------------- | --------------------------------------------------------------- |
| type       | true     | `date`              | Condition that requires a date to have passed                   |
| date       | true     | string (YYYY-MM-DD) | Timestamp that needs to be passed for the condition to be true. |

#### CodeQuestionCondition

| Properties   | Required | Type                                | Description                                                                     |
| ------------ | -------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| type         | true     | `question`                          | Condition that requires a specific answer from a previous survey                |
| questionType | true     | `coding`                            | Condition that uses authored date of the response fulfilling the code condition |
| surveyName   | true     | string                              | Identifier of the survey                                                        |
| linkID       | true     | string                              | Identifier of the question                                                      |
| operand      | false    | string                              | (unless operator is `exists`). Used as `<answer>` `<operator>` `<operand>`.     |
| operator     | true     | `exists`,`=`,`!=`,`>`,`<`,`>=`,`<=` | Used as `<answer>` `<operator>` `<operand>`.                                    |

#### DateQuestionCondition

| Properties   | Required | Type       | Description                                                           |
| ------------ | -------- | ---------- | --------------------------------------------------------------------- |
| type         | true     | `question` | Condition that requires a specific answer from a previous survey      |
| questionType | true     | `date`     | Condition that uses the answer of a date question as fulfillment date |
| surveyName   | true     | string     | Identifier of the survey                                              |
| linkID       | true     | string     | Identifier of the question                                            |

#### SurveyCondition

| Properties | Required | Type     | Description                                                      |
| ---------- | -------- | -------- | ---------------------------------------------------------------- |
| type       | true     | `survey` | Condition that requires a previous survey to have been completed |
| surveyName | true     | string   | Identifier of the survey                                         |

#### RoutineCondition

| Properties  | Required | Type      | Description                                                       |
| ----------- | -------- | --------- | ----------------------------------------------------------------- |
| type        | true     | `routine` | Condition that requires a previous routine to have been completed |
| routineName | true     | string    | Identifier of the routine                                         |

#### ConsentCondition

| Properties | Required | Type      | Description                                                                    |
| ---------- | -------- | --------- | ------------------------------------------------------------------------------ |
| type       | true     | `consent` | Condition that require a specific consent to be given                          |
| consentKey | true     | string    | Reference to the consent that must have been granted to fulfill the condition. |

#### ResponseCondition

| Properties   | Required | Type       | Description                                                                      |
| ------------ | -------- | ---------- | -------------------------------------------------------------------------------- |
| type         | true     | `response` | Condition that require a specific response to be received                        |
| responseName | true     | string     | Reference to the response that must have been received to fulfill the condition. |

#### AndCondition

| Properties | Required | Type                 | Description                                                                      |
| ---------- | -------- | -------------------- | -------------------------------------------------------------------------------- |
| type       | true     | `and`                | Condition that requires all subconditions to be fulfilled                        |
| items      | true     | StepCondition[]      | List of conditions that must all be fulfilled.                                   |
| sorting    | false    | `earliest`, `latest` | Determines which resulting dates of the items gets picked. Defaults to `latest`. |

#### OrCondition

| Properties | Required | Type                 | Description                                                                        |
| ---------- | -------- | -------------------- | ---------------------------------------------------------------------------------- |
| type       | true     | `or`                 | Condition that requires one subcondition to be fulfilled                           |
| items      | true     | StepCondition[]      | List of conditions where at least one must be fulfilled.                           |
| sorting    | false    | `earliest`, `latest` | Determines which resulting dates of the items gets picked. Defaults to `earliest`. |

#### OffsetCondition

| Properties | Required | Type                     | Description                                                                         |
| ---------- | -------- | ------------------------ | ----------------------------------------------------------------------------------- |
| type       | true     | `offset`                 | Condition that adds a date offset to the fulfillment date of the given subcondition |
| offset     | true     | ISO 8601 duration string | Offset as duration, can be negative.                                                |
| item       | true     | StepCondition            | Condition to apply the additional offset to.                                        |

### ProgramDonation

| Properties             | Required | Type                                          | Description                                                                                     |
| ---------------------- | -------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| donation.consentKey    | false    | string                                        | The consent key identifying the consent the user has to sign for data donation in this program. |
| donation.delay         | true     | number                                        | The number of days after which a resource can be donated.                                       |
| donation.revocation    | true     | `delete`, `anonymize`                         | Determines what happens to the data after donation was revoked. Defaults to `delete`.           |
| donation.anonymization | false    | [ProgramAnonymization](#ProgramAnonymization) | The set of the anonymization functions which should be applied to all resources of the program. |
| donation.target        | true     | string                                        | The target which should be used for data donation.                                              |

#### ProgramAnonymization

| Properties    | Required | Type                                          | Description                                                                                                            |
| ------------- | -------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| blur          | false    | object                                        | The set of blurring settings that should be applied to the resource.                                                   |
| blur.authored | false    | [DateBlurringFunction](#DateBlurringFunction) | The name of the default blurring function which is used to blur the authored timestamp of every QuestionnaireResponse. |
| blur.authored | false    | [DateBlurringFunction](#DateBlurringFunction) | The name of the default blurring function which is used to blur the period start and end of every ResearchSubject.     |

#### DateBlurringFunction

| Type         | Description                                      |
| ------------ | ------------------------------------------------ |
| startOfDay   | Sets time to the start of the day (00:00:00)     |
| endOfDay     | Sets time to the end of the day (23:59:59.99...) |
| startOfWeek  | Sets date to the start of monday                 |
| endOfWeek    | Sets date to the end of sunday                   |
| startOfMonth | Sets date to the start of the first of the month |
| endOfMonth   | Sets date to the end of the last of th month     |

#### ProgramContent

| Properties               | Required | Type                              | Description                                              |
| ------------------------ | -------- | --------------------------------- | -------------------------------------------------------- |
| title                    | true     | {language: string}                | Display title of the program.                            |
| description              | true     | {language: string}                | Display description of the program.                      |
| contact                  | true     | {language: string}                | Contact information to display for the user.             |
| contactInfo              | true     | [ProgramContact](#ProgramContact) | Contact information to display for the user.             |
| image                    | false    | string                            | Image of the program                                     |
| institute                | false    | object                            | requires `name` if `image` is set                        |
| privacyPolicy            | false    | object                            | requires `text`                                          |
| participationInformation | false    | object                            | requires `text`                                          |
| eligibility              | false    | object                            | requires `title`, `description`, `include` and `exclude` |

#### ProgramContact

| Properties | Required | Type   | Description                             |
| ---------- | -------- | ------ | --------------------------------------- |
| email      | false    | string | Email address to contact for questions. |
| phone      | false    | string | Phone number to contact for questions.  |

#### ProgramTag

| Properties    | Required | Type                              | Description                                     |
| ------------- | -------- | --------------------------------- | ----------------------------------------------- |
| code          | true     | string                            | The code identifying this tag                   |
| labels        | true     | TranslatedString                  | Set of human readable translations for this tag |
| effectiveType | true     | 'dateTime', 'period' or 'unknown' | The type of tag                                 |

### Survey

| Properties     | Required | Type                                | Description                                                                                                           |
| -------------- | -------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| name           | true     | string                              | Primary identifier. Assumption: survey and routine names are collectively unique                                      |
| programName    | true     | string                              | The name of the program the survey belongs to                                                                         |
| frequency      | true     | [TaskFrequency](#TaskFrequency)     | Defines in which frequency the questionnaire occurs                                                                   |
| scoring        | true     | [SurveyScoring](#SurveyScoring)     | Defines the texts, images and icons that need to be displayed for the survey                                          |
| content        | true     | [SurveyContent](#SurveyContent)     | Defines the texts, images and icons that need to be displayed for the survey                                          |
| template       | false    | string                              | Name of the template used for the questionnaire (templated surveys don't allow questions to be changed)               |
| publishedAt    | false    | ISO 8601 date with timezone         | Date the survey was published.                                                                                        |
| multiplex      | false    | [SurveyMultiplex](#SurveyMultiplex) | Configures that this survey will be answered multiple times per window based on the answers of another questionnaire. |
| copyrightLabel | false    | CopyrightLabel                      | Optional copyright/trademark text shown on questionnaire screens                                                      |
| withheld       | true     | boolean                             | If true, the survey will not be published yet                                                                         |

#### TaskFrequency

| Properties           | Required | Type                            | Description                                                                                                                                                                                                                                                                                                  |
| -------------------- | -------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| type                 | true     | [FrequencyType](#FrequencyType) | Defines how often and when a questionnaire is triggered/added for the survey                                                                                                                                                                                                                                 |
| start                | true     | ISO 8601 date with timezone     | Determines the global starting date of the survey. The time component is also used for when the events should be available on the day they become available.                                                                                                                                                 |
| end                  | false    | ISO 8601 date with timezone     | Determines the global ending date of the survey.                                                                                                                                                                                                                                                             |
| factor               | false    | integer                         | For `daily`, `weekly` and `monthly` this factor is used to manipulate the cycle length, e.g. `daily` with a factor of 7 makes it a survey that is repeated every week, but doesn't necessarily start on monday.                                                                                              |
| editDuration         | false    | ISO 8601 duration string        | Enables editing events of this survey for the given duration.                                                                                                                                                                                                                                                |
| skipFirst            | false    | boolean                         | Determines if the first iteration of the survey after subscription should be skipped. Skipping it means the questionnaire won't open in the middle of the window and instead at the start of the next full window. Defaults to `false`.                                                                      |
| retainCTAs           | false    | number                          | Allows configuring that x amount of previous CTAs remain active on the todo screen.                                                                                                                                                                                                                          |
| allowAddOnDemand     | false    | boolean                         | If true allows the task to also be added at any point in time (on demand).                                                                                                                                                                                                                                   |
| availabilityDuration | false    | ISO 8601 duration string        | How long each occurrence stays actionable after `start`. Currently honored for recurring tasks only, where it defines a per-window slot [windowStart, windowStart + availabilityDuration] and MUST be <= one window (factor x unit) so at most one slot is ever open. Omit for "available the whole window". |

#### SurveyScoring

| Properties      | Required | Type                                          | Description                                                                        |
| --------------- | -------- | --------------------------------------------- | ---------------------------------------------------------------------------------- |
| eligibility     | false    | boolean                                       | Indicates if the scoring is suitable for eligibility.                              |
| scores          | true     | object                                        | Defines how the questions will be scored                                           |
| scores.valueset | false    | {valuesetURL: {answerCode: score}}            | For questions that use valuesets scores are assigned to each code of the valuesets |
| scores.number   | false    | {linkId: [ScoreThreshold](#ScoreThreshold)[]} | For numeric questions we define scoring conditions per question                    |

#### ScoreThreshold

| Properties | Required | Type                             | Description                                                          |
| ---------- | -------- | -------------------------------- | -------------------------------------------------------------------- |
| operator   | true     | `eq`, `lt`, `lteq`, `gt`, `gteq` | Defines the operator to use with the threshold                       |
| threshold  | true     | number                           | Threshold that is used with the operator                             |
| score      | true     | number                           | Score that is added when the operator and threshold condition is met |

#### FrequencyType

| Type     | Description                                               |
| -------- | --------------------------------------------------------- |
| single   | Occurs only once                                          |
| daily    | Occurs every day                                          |
| weekly   | Occurs every Monday                                       |
| monthly  | Occurs every 1st of a month                               |
| onDemand | There is a button that allows you to add one at any point |

#### SurveyContent

| Properties          | Required | Type                 | Description                                |
| ------------------- | -------- | -------------------- | ------------------------------------------ |
| default             | true     | object               | Default values for survey texts and images |
| default.title       | true     | {[language]: text}   | Survey title in available languages        |
| default.description | false    | {[language]: text}   | Survey description in available languages  |
| default.image       | false    | data URI encoded svg | Survey image in html usable format         |
| default.icon        | false    | data URI encoded svg | Survey icon in html usable format          |

#### SurveyMultiplex

| Properties  | Required | Type              | Description                                                                                                                                                                                                                                                                                             |
| ----------- | -------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| source      | true     | object            | LEGACY(prepopulate) [HUB-6797] — replaced by `topic`; remove when retired. The keys of the object are the questionnaire names and the values are the linkIds of the questions whose answers will be used for multiplexing. The answers to these questions will be used to fill the placeholder.         |
| lookup      | true     | `all` or `latest` | LEGACY(prepopulate) [HUB-6797] — replaced by `scope`; remove when retired. Defines how the answers of the source questions will be looked up. `latest` means only the latest iteration of the source questionnaires will be used, `all` means all iterations of the source questionnaires will be used. |
| topic       | false    | string            | Canonical topic URL whose accumulated values drive the multiplexing (replaces `source`). When set, it takes precedence over `source`/`lookup`.                                                                                                                                                          |
| scope       | false    | `all` or `latest` | How far back to read the topic (replaces `lookup`). `all` = every response, `latest` = the most recent.                                                                                                                                                                                                 |
| placeholder | true     | string            | Placeholder text to be replaced with answers from the specified linkIds                                                                                                                                                                                                                                 |

### Routine

| Properties  | Required                 | Type                                | Description                                                                      |
| ----------- | ------------------------ | ----------------------------------- | -------------------------------------------------------------------------------- |
| name        | true                     | string                              | Primary identifier. Assumption: survey and routine names are collectively unique |
| programName | true                     | string                              | The name of the program the routine belongs to                                   |
| frequency   | true                     | [TaskFrequency](#TaskFrequency)     | Defines in which frequency the questionnaire occurs                              |
| content     | true                     | [RoutineContent](#RoutineContent)   | Defines the texts, images and icons that need to be displayed for the routine    |
| devices     | true                     | string[]                            | Lists the devices used in the routine                                            |
| duration    | ISO 8601 duration String | Defines the duration of the routine |
| publishedAt | false                    | ISO 8601 date with timezone         | Date the routine was published.                                                  |
| withheld    | true                     | boolean                             | If true, the routine will not be published yet                                   |

#### ProgramDevice

| Properties    | Required | Type                                                | Description                                                                                                                       |
| ------------- | -------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| type          | true     | [ProgramDeviceType](#ProgramDeviceType)             | Device identifier                                                                                                                 |
| dataTypes     | true     | [ProgramDevicesDataType](#ProgramDevicesDataType)[] | List of data types to collect                                                                                                     |
| labels        | true     | [ProgramDevicesLabel](#ProgramDevicesLabel)[]       | List of labels                                                                                                                    |
| outputRate    | false    | number                                              | Sampling rate in hz                                                                                                               |
| sensorDelay   | false    | number                                              | Sensor delay as per Android constants https://developer.android.com/reference/android/hardware/SensorManager#SENSOR_DELAY_FASTEST |
| streamingMode | false    | string                                              | Device specific streaming mode to use for data types                                                                              |
| clientID      | false    | string                                              | ClientID required to request data via API                                                                                         |
| clientTarget  | false    | `prod`/`sandbox`                                    | Identifier which URL set to use for API communication. Defaults to prod if unset                                                  |

#### RoutineContent

| Properties    | Required | Type                                        | Description                                 |
| ------------- | -------- | ------------------------------------------- | ------------------------------------------- |
| default       | true     | object                                      | Default values for routine texts and images |
| default.title | true     | {[language]: text}                          | Routine title in available languages        |
| steps         | true     | [RoutineContentStep[]](#RoutineContentStep) | Routine steps                               |

#### RoutineContentStep

| Properties | Required | Type                                             | Description                                  |
| ---------- | -------- | ------------------------------------------------ | -------------------------------------------- |
| title      | true     | {[language]: text}                               | Step title in available languages            |
| blocks     | true     | {image?: text, instructions: {[language]: text}} | Step blocks including image and instructions |

### Display

| Properties  | Required | Type                                                      | Description                                                                      |
| ----------- | -------- | --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| name        | true     | string                                                    | Primary identifier. Assumption: survey and display names are collectively unique |
| programName | true     | string                                                    | The name of the program the display belongs to                                   |
| displayType | true     | 'report' / 'recommendation'                               | The type of the display (report or recommendation)                               |
| frequency   | true     | [TaskFrequency](#TaskFrequency)                           | Defines in which frequency the questionnaire occurs                              |
| content     | true     | [DisplayContent](#DisplayContent)                         | Defines the texts, images and icons that need to be displayed for the display    |
| charts      | false    | { [key in ProgramDeviceType]?: ProgramDevicesDataType[] } | List of devices and their data types that are relevant for the display           |
| publishedAt | false    | ISO 8601 date with timezone                               | Date the display was published.                                                  |
| withheld    | true     | boolean                                                   | If true, the survey will not be published yet                                    |

#### DisplayContent

| Properties      | Required | Type                            | Description                                 |
| --------------- | -------- | ------------------------------- | ------------------------------------------- |
| default         | true     | object                          | Default values for display texts and images |
| default.title   | true     | {[language]: text}              | Display title in available languages        |
| default.message | true     | {[language]: text}              | Display message in available languages      |
| blocks          | false    | [ContentBlock](#ContentBlock)[] | Content blocks for the display              |

#### ContentBlock

| Properties | Required | Type               | Description                                   |
| ---------- | -------- | ------------------ | --------------------------------------------- |
| image      | false    | object             | Optional image for the content block          |
| image.src  | true     | string             | Image source URL                              |
| image.alt  | false    | {[language]: text} | Alt text for the image in available languages |
| text       | true     | {[language]: text} | Block text in available languages             |
