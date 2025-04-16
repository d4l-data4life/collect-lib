// Structure Definitions
export const SliderMinLabelExtension = 'http://fhir.data4life.care/StructureDefinition/slider-label-min';
export const SliderMaxLabelExtension = 'http://fhir.data4life.care/StructureDefinition/slider-label-max';
export const SliderStepSizeExtension = 'http://fhir.data4life.care/StructureDefinition/slider-step-size';
export const RelativeMinValueExtension = 'http://fhir.data4life.care/StructureDefinition/relative-min-value';
export const RelativeMaxValueExtension = 'http://fhir.data4life.care/StructureDefinition/relative-max-value';
export const CustomExtensionStudyName = 'http://fhir.data4life.care/StructureDefinition/study-name';
export const CustomExtensionDate = 'http://fhir.data4life.care/StructureDefinition/effective-date';
export const MaxValueExtension = 'http://hl7.org/fhir/StructureDefinition/maxValue';
export const MinValueExtension = 'http://hl7.org/fhir/StructureDefinition/minValue';
export const MinLengthExtension = 'http://hl7.org/fhir/StructureDefinition/minLength';
export const QItemControlDefinition = 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl';
export const RoutineIsPassiveExtension =
  'http://fhir.data4life.care/StructureDefinition/is-passive-recording';
// Naming Systems
export const SignalIDSystem = 'http://fhir.data4life.care/r5/NamingSystem/app-signal-ids';
export const AppIDNamingSystem = 'http://fhir.data4life.care/r5/NamingSystem/app-db-ids';
export const SensorTypeSystem = 'http://fhir.data4life.care/r5/NamingSystem/sensor-device-type';
export const SensorIdentifierSystem = 'http://fhir.data4life.care/r5/NamingSystem/sensor-peripheral-id';
export const TokenNamingSystem = 'http://fhir.data4life.care/r5/NamingSystem/participation-token';
export const ConsentNameSystem = 'http://fhir.data4life.care/r5/NamingSystem/consent-name';
export const ConsentVersionSystem = 'http://fhir.data4life.care/r5/NamingSystem/consent-version';
// Code Systems
export const ObservationTypeSystem = 'http://fhir.data4life.care/r5/CodeSystem/observation-types';
export const MeasurementTypeSystem = 'http://fhir.data4life.care/r5/CodeSystem/sensor-measurement-types';
export const StudyNameSystem = 'http://fhir.data4life.care/r5/CodeSystem/study-name';
export const SensorSettingsSystem = 'http://fhir.data4life.care/r5/CodeSystem/sensor-settings';
export const CustomQuestionSystem = 'http://fhir.data4life.care/r5/CodeSystem/custom-question-class';
export const CommunicationTypeSystem = 'http://fhir.data4life.care/r5/CodeSystem/communication-types';

/**
 * See: https://build.fhir.org/valueset-research-subject-state.html
 */
export enum ResearchSubjectProgressState {
  CANDIDATE = 'candidate',
  ELIGIBLE = 'eligible',
  FOLLOW_UP = 'follow-up',
  INELIGIBLE = 'ineligible',
  NOT_REGISTERED = 'not-registered',
  OFF_STUDY = 'off-study',
  ON_STUDY = 'on-study',
  ON_STUDY_INTERVENTION = 'on-study-intervention',
  ON_STUDY_OBSERVATION = 'on-study-observation',
  PENDING_ON_STUDY = 'pending-on-study',
  POTENTIAL_CANDIDATE = 'potential-candidate',
  SCREENING = 'screening',
  WITHDRAWN = 'withdrawn',
}
