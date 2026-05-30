import { DEVICE_SIGNAL_TYPE } from '../types';
import {
  FITBIT_BREATHING_RATE_ANNOTATION,
  FITBIT_CALORIES_ANNOTATION,
  FITBIT_HEART_RATE_ANNOTATION,
  FITBIT_HEART_RATE_VARIABILITY_ANNOTATION,
  FITBIT_SKIN_TEMPERATURE_ANNOTATION,
  FITBIT_SLEEP_ANNOTATION,
  FITBIT_SPO2_ANNOTATION,
  FITBIT_STEPS_ANNOTATION,
} from './fitbit';
import { DEVICE_ANNOTATION } from './types';

// Aliased to Fitbit: Google Health emits the same physical quantities and we
// store them with the same on-device buffer encoding so a study can ingest
// both sources through the same FHIR pipeline. Fork only if a signal's
// data shape diverges from Fitbit's.
export const GOOGLE_HEALTH_SIGNAL_TYPE_ANNOTATIONS: {
  [key in DEVICE_SIGNAL_TYPE]?: DEVICE_ANNOTATION;
} = {
  calories: FITBIT_CALORIES_ANNOTATION,
  steps: FITBIT_STEPS_ANNOTATION,
  heartRate: FITBIT_HEART_RATE_ANNOTATION,
  hrv: FITBIT_HEART_RATE_VARIABILITY_ANNOTATION,
  respiratoryRate: FITBIT_BREATHING_RATE_ANNOTATION,
  skinTemperature: FITBIT_SKIN_TEMPERATURE_ANNOTATION,
  sleep: FITBIT_SLEEP_ANNOTATION,
  spo2: FITBIT_SPO2_ANNOTATION,
};
