import { DEVICE_SIGNAL_TYPE } from '../types';
import {
  BREATHING_RATE_ANNOTATION,
  CALORIES_ANNOTATION,
  HEART_RATE_ANNOTATION,
  HEART_RATE_VARIABILITY_ANNOTATION,
  SKIN_TEMPERATURE_ANNOTATION,
  SLEEP_ANNOTATION,
  SPO2_ANNOTATION,
  STEPS_ANNOTATION,
} from './common';
import { DEVICE_ANNOTATION } from './types';

// Aliased to the shared encodings: Google Health emits the same physical quantities and we
// store them with the same on-device buffer encoding so a study can ingest
// both sources through the same FHIR pipeline. Fork only if a signal's
// data shape diverges from the shared encoding.
export const GOOGLE_HEALTH_SIGNAL_TYPE_ANNOTATIONS: {
  [key in DEVICE_SIGNAL_TYPE]?: DEVICE_ANNOTATION;
} = {
  calories: CALORIES_ANNOTATION,
  steps: STEPS_ANNOTATION,
  heartRate: HEART_RATE_ANNOTATION,
  hrv: HEART_RATE_VARIABILITY_ANNOTATION,
  respiratoryRate: BREATHING_RATE_ANNOTATION,
  skinTemperature: SKIN_TEMPERATURE_ANNOTATION,
  sleep: SLEEP_ANNOTATION,
  spo2: SPO2_ANNOTATION,
};
