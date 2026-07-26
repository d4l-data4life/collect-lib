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
import { OURA_STRESS_ANNOTATION } from './oura';
import { DEVICE_ANNOTATION } from './types';

// Garmin Health API metrics re-use the shared buffer encodings so a study can
// ingest Fitbit, Google Health, Oura and Garmin through the same FHIR pipeline.
// TODO: add body battery / VO2 max once dedicated DEVICE_SIGNAL_TYPEs exist for them.
export const GARMIN_SIGNAL_TYPE_ANNOTATIONS: {
  [key in DEVICE_SIGNAL_TYPE]?: DEVICE_ANNOTATION;
} = {
  heartRate: HEART_RATE_ANNOTATION,
  hrv: HEART_RATE_VARIABILITY_ANNOTATION,
  spo2: SPO2_ANNOTATION,
  sleep: SLEEP_ANNOTATION,
  steps: STEPS_ANNOTATION,
  calories: CALORIES_ANNOTATION,
  respiratoryRate: BREATHING_RATE_ANNOTATION,
  skinTemperature: SKIN_TEMPERATURE_ANNOTATION,
  stress: OURA_STRESS_ANNOTATION,
};
