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

// #region Sleep levels (Fitbit-specific vocabulary)
/**
 * Encodes the Fitbit api sleep level types to unsigned integers for buffer encoding
 */
export type FitbitSleepLevelTypes =
  //classic
  | 'restless'
  | 'asleep'
  | 'awake'
  //stages
  | 'deep'
  | 'light'
  | 'rem'
  | 'wake';

export const FITBIT_SLEEP_LEVEL_MAP: { [key in FitbitSleepLevelTypes]: number } = {
  //stages
  wake: 0,
  rem: 1,
  light: 2,
  deep: 3,
  //classic
  awake: 10,
  restless: 11,
  asleep: 12,
};
// #endregion

// Fitbit's per-signal annotation map. Overlapping signals reuse the shared encodings from
// ./common; this is a sibling of GARMIN_SIGNAL_TYPE_ANNOTATIONS, OURA_SIGNAL_TYPE_ANNOTATIONS,
// GOOGLE_HEALTH_SIGNAL_TYPE_ANNOTATIONS, etc.
export const FITBIT_SIGNAL_TYPE_ANNOTATIONS: { [key in DEVICE_SIGNAL_TYPE]?: DEVICE_ANNOTATION } = {
  calories: CALORIES_ANNOTATION,
  steps: STEPS_ANNOTATION,
  heartRate: HEART_RATE_ANNOTATION,
  hrv: HEART_RATE_VARIABILITY_ANNOTATION,
  respiratoryRate: BREATHING_RATE_ANNOTATION,
  skinTemperature: SKIN_TEMPERATURE_ANNOTATION,
  sleep: SLEEP_ANNOTATION,
  spo2: SPO2_ANNOTATION,
};
