// Structure Definitions
export const SliderMinLabelExtension = 'http://fhir.data4life.care/StructureDefinition/slider-label-min';
export const SliderMaxLabelExtension = 'http://fhir.data4life.care/StructureDefinition/slider-label-max';
export const SliderStepSizeExtension = 'http://fhir.data4life.care/StructureDefinition/slider-step-size';
export const SliderOrientationExtension = 'http://fhir.data4life.care/StructureDefinition/slider-orientation';
export const SliderInputLabel = 'http://fhir.data4life.care/StructureDefinition/slider-input-label';
export const RelativeMinValueExtension = 'http://fhir.data4life.care/StructureDefinition/relative-min-value';
export const RelativeMaxValueExtension = 'http://fhir.data4life.care/StructureDefinition/relative-max-value';
export const CustomExtensionStudyName = 'http://fhir.data4life.care/StructureDefinition/study-name';
export const CustomExtensionContextValue = 'http://fhir.data4life.care/StructureDefinition/context-value';
export const CustomExtensionDate = 'http://fhir.data4life.care/StructureDefinition/effective-date';
export const MaxValueExtension = 'http://hl7.org/fhir/StructureDefinition/maxValue';
export const MinValueExtension = 'http://hl7.org/fhir/StructureDefinition/minValue';
export const MinLengthExtension = 'http://hl7.org/fhir/StructureDefinition/minLength';
export const QItemControlDefinition = 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl';
export const RoutineIsPassiveExtension = 'http://fhir.data4life.care/StructureDefinition/is-passive-recording';
export const PrepopulateExtension = 'http://fhir.data4life.care/StructureDefinition/prepopulate';
export const ImageExtension = 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemMedia';
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
// Canonical FHIR ValueSet URL for ISO 3166-1 alpha-2 country codes. Referenced
// by the `country` input type; consumers render a dedicated country picker and
// submit answers as a valueCoding with the ISO 3166 system below.
export const CountryValueSet = 'http://hl7.org/fhir/ValueSet/iso3166-1-2';
export const Iso3166CodeSystem = 'urn:iso:std:iso:3166';

// Complex extension carrying the country source for a `postal-code` input. Sub-
// extensions: `fromItem` (valueString = another item's linkId) XOR
// `fixedCountry` (valueCoding with system Iso3166CodeSystem).
export const PostalCodeCountrySourceExtension =
  'http://fhir.data4life.care/fhir/StructureDefinition/postalcode-country-source';
export const PostalCodeFromItemUrl = 'fromItem';
export const PostalCodeFixedCountryUrl = 'fixedCountry';

export const DEVICE_LABEL_CODING = {
  system: SensorSettingsSystem,
  code: 'device_label',
  display: 'Device label',
};

export const DEVICE_DISPLAY_LABEL_CODING = {
  system: SensorSettingsSystem,
  code: 'display_label',
  display: 'Display Label',
};

export const DEVICE_OUTPUT_RATE_CODING = {
  system: 'urn:iso:std:iso:11073:10101',
  code: '68320',
  display: 'MDC_ATTR_SAMPLE_RATE',
};

export const DEVICE_SENSOR_DELAY_CODING = {
  system: SensorSettingsSystem,
  code: 'sensor_delay',
  display: 'Sensor delay',
};

export const SIGNAL_DURATION_CODING = {
  system: 'http://loinc.org',
  code: '8838-5',
  display: 'Observation duration',
};

export const ANDROID_SENSORS_CONSTANT_NAMES = [
  'SENSOR_DELAY_FASTEST',
  'SENSOR_DELAY_GAME',
  'SENSOR_DELAY_UI',
  'SENSOR_DELAY_NORMAL',
];
