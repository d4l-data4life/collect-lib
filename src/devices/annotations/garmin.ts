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
import { MENSTRUAL_CYCLE_ANNOTATION } from './menstrual';
import { OURA_STRESS_ANNOTATION } from './oura';
import { BLE_CPMS_ANNOTATION_ITEM_DAILY_FLOORS } from './wearOS3';
import { DEVICE_ANNOTATION } from './types';

// Garmin Health API metrics re-use the shared Fitbit buffer encodings so a study can
// ingest Fitbit, Google Health, Oura and Garmin through the same FHIR pipeline.
// TODO: add body battery / VO2 max once dedicated DEVICE_SIGNAL_TYPEs exist for them.
export const GARMIN_SIGNAL_TYPE_ANNOTATIONS: {
  [key in DEVICE_SIGNAL_TYPE]?: DEVICE_ANNOTATION;
} = {
  heartRate: FITBIT_HEART_RATE_ANNOTATION,
  hrv: FITBIT_HEART_RATE_VARIABILITY_ANNOTATION,
  spo2: FITBIT_SPO2_ANNOTATION,
  sleep: FITBIT_SLEEP_ANNOTATION,
  steps: FITBIT_STEPS_ANNOTATION,
  calories: FITBIT_CALORIES_ANNOTATION,
  respiratoryRate: FITBIT_BREATHING_RATE_ANNOTATION,
  skinTemperature: FITBIT_SKIN_TEMPERATURE_ANNOTATION,
  stress: OURA_STRESS_ANNOTATION,
  menstrualCycle: MENSTRUAL_CYCLE_ANNOTATION,
  // Daily floors climbed: cumulative day total from /dailies (same float32 encoding
  // as the Wear OS daily counter).
  dailyFloors: [BLE_CPMS_ANNOTATION_ITEM_DAILY_FLOORS],
};
