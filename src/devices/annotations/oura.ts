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
import { DEVICE_ANNOTATION, DEVICE_ANNOTATION_ITEM } from './types';

// #region Stress
export const OURA_ANNOTATION_ITEM_STRESS: DEVICE_ANNOTATION_ITEM = {
  type: 'stress',
  size: 4,
  format: 'float32',
  littleEndian: true,
  unit: 'level',
};

export const OURA_STRESS_ANNOTATION: DEVICE_ANNOTATION = [OURA_ANNOTATION_ITEM_STRESS];
// #endregion

// #region Workout (single duration field; full payload kept in FHIR pipeline)
export const OURA_ANNOTATION_ITEM_WORKOUT: DEVICE_ANNOTATION_ITEM = {
  type: 'workout',
  size: 4,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 's',
};

export const OURA_WORKOUT_ANNOTATION: DEVICE_ANNOTATION = [OURA_ANNOTATION_ITEM_WORKOUT];
// #endregion

// #region Tag (enhanced tag; payload kept in FHIR pipeline)
export const OURA_ANNOTATION_ITEM_TAG: DEVICE_ANNOTATION_ITEM = {
  type: 'tag',
  size: 4,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 's',
};

export const OURA_TAG_ANNOTATION: DEVICE_ANNOTATION = [OURA_ANNOTATION_ITEM_TAG];
// #endregion

// Overlapping signals re-use Fitbit's buffer encoding so a study can ingest data
// from Fitbit, Google Health and Oura through the same FHIR pipeline.
export const OURA_SIGNAL_TYPE_ANNOTATIONS: {
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
  stress: OURA_STRESS_ANNOTATION,
  workout: OURA_WORKOUT_ANNOTATION,
  tag: OURA_TAG_ANNOTATION,
};
