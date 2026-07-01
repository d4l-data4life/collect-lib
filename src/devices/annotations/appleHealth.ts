import { DEVICE_SIGNAL_TYPE, DEVICE_SIGNAL_TYPE_APPLE } from '../types';
import { DEVICE_ANNOTATION_ITEM_DATA_SOURCE } from './base';
import { DEVICE_ANNOTATION, DEVICE_ANNOTATION_ITEM } from './types';

// #region Step Count
export const APPLE_HEALTH_ANNOTATION_ITEM_STEP_COUNT: DEVICE_ANNOTATION_ITEM = {
  type: 'stepCount',
  size: 4,
  format: 'signedInt',
  littleEndian: true,
};

export const APPLE_HEALTH_ANNOTATION_STEP_COUNT: DEVICE_ANNOTATION = [
  APPLE_HEALTH_ANNOTATION_ITEM_STEP_COUNT,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];
// #endregion

// #region Walking and Running Distance
export const APPLE_HEALTH_ANNOTATION_ITEM_WALKING_RUNNING_DISTANCE: DEVICE_ANNOTATION_ITEM = {
  type: 'walkingAndRunningDistance',
  size: 4,
  format: 'float32',
  littleEndian: true,
};

export const APPLE_HEALTH_ANNOTATION_WALKING_RUNNING_DISTANCE: DEVICE_ANNOTATION = [
  APPLE_HEALTH_ANNOTATION_ITEM_WALKING_RUNNING_DISTANCE,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];
// #endregion

// #region Active Energy
export const APPLE_HEALTH_ANNOTATION_ITEM_ACTIVE_ENERGY: DEVICE_ANNOTATION_ITEM = {
  type: 'activeEnergy',
  size: 4,
  format: 'float32',
  littleEndian: true,
};

export const APPLE_HEALTH_ANNOTATION_ACTIVE_ENERGY: DEVICE_ANNOTATION = [
  APPLE_HEALTH_ANNOTATION_ITEM_ACTIVE_ENERGY,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];
// #endregion

// #region Sleep Analysis

/**
 * Apple Health sleep states
 * Awake → 0
 * REM   → 1
 * Core  → 2
 * Deep  → 3
 */
export type AppleHealthSleepStates = 'awake' | 'rem' | 'core' | 'deep';

export const APPLE_HEALTH_SLEEP_STATE_MAP: { [key in AppleHealthSleepStates]: number } = {
  awake: 0,
  rem: 1,
  core: 2,
  deep: 3,
};

export const APPLE_HEALTH_ANNOTATION_ITEM_SLEEP_STATE: DEVICE_ANNOTATION_ITEM = {
  type: 'sleepState',
  size: 1,
  format: 'unsignedInt',
  littleEndian: true,
};

export const APPLE_HEALTH_ANNOTATION_ITEM_SLEEP_DURATION: DEVICE_ANNOTATION_ITEM = {
  type: 'duration',
  size: 2,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 's',
};

export const APPLE_HEALTH_ANNOTATION_SLEEP_ANALYSIS: DEVICE_ANNOTATION = [
  APPLE_HEALTH_ANNOTATION_ITEM_SLEEP_STATE,
  APPLE_HEALTH_ANNOTATION_ITEM_SLEEP_DURATION,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];
// #endregion

// #region Heart Rate
export const APPLE_HEALTH_ANNOTATION_ITEM_HEART_RATE: DEVICE_ANNOTATION_ITEM = {
  type: 'heartRate',
  size: 1,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'bpm',
};

export const APPLE_HEALTH_ANNOTATION_HEART_RATE: DEVICE_ANNOTATION = [
  APPLE_HEALTH_ANNOTATION_ITEM_HEART_RATE,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];
// #endregion

// #region Resting Heart Rate
export const APPLE_HEALTH_ANNOTATION_ITEM_RESTING_HEART_RATE: DEVICE_ANNOTATION_ITEM = {
  type: 'restingHeartRate',
  size: 1,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'bpm',
};

export const APPLE_HEALTH_ANNOTATION_RESTING_HEART_RATE: DEVICE_ANNOTATION = [
  APPLE_HEALTH_ANNOTATION_ITEM_RESTING_HEART_RATE,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];
// #endregion

// #region Heart Rate Variability
export const APPLE_HEALTH_ANNOTATION_ITEM_HRV: DEVICE_ANNOTATION_ITEM = {
  type: 'hrv',
  size: 4,
  format: 'float32',
  littleEndian: true,
  unit: 'ms',
};

export const APPLE_HEALTH_ANNOTATION_HRV: DEVICE_ANNOTATION = [
  APPLE_HEALTH_ANNOTATION_ITEM_HRV,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];
// #endregion

// #region Respiratory Rate
export const APPLE_HEALTH_ANNOTATION_ITEM_RESPIRATORY_RATE: DEVICE_ANNOTATION_ITEM = {
  type: 'respiratoryRate',
  size: 4,
  format: 'float32',
  littleEndian: true,
  unit: 'breaths/min',
};

export const APPLE_HEALTH_ANNOTATION_RESPIRATORY_RATE: DEVICE_ANNOTATION = [
  APPLE_HEALTH_ANNOTATION_ITEM_RESPIRATORY_RATE,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];
// #endregion

// #region SpO2
export const APPLE_HEALTH_ANNOTATION_ITEM_SPO2: DEVICE_ANNOTATION_ITEM = {
  type: 'spo2',
  size: 4,
  format: 'float32',
  littleEndian: true,
  unit: '%',
};

export const APPLE_HEALTH_ANNOTATION_SPO2: DEVICE_ANNOTATION = [
  APPLE_HEALTH_ANNOTATION_ITEM_SPO2,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];
// #endregion

// #region Skin Temperature
export const APPLE_HEALTH_ANNOTATION_ITEM_SKIN_TEMPERATURE: DEVICE_ANNOTATION_ITEM = {
  type: 'skinTemperature',
  size: 4,
  format: 'float32',
  littleEndian: true,
  unit: '˚C',
};

export const APPLE_HEALTH_ANNOTATION_SKIN_TEMPERATURE: DEVICE_ANNOTATION = [
  APPLE_HEALTH_ANNOTATION_ITEM_SKIN_TEMPERATURE,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];
// #endregion

// #region Signal Type Annotations
export const APPLE_HEALTH_SIGNAL_TYPE_ANNOTATIONS: {
  [key in DEVICE_SIGNAL_TYPE_APPLE]?: DEVICE_ANNOTATION;
} = {
  stepCount: APPLE_HEALTH_ANNOTATION_STEP_COUNT,
  walkingAndRunningDistance: APPLE_HEALTH_ANNOTATION_WALKING_RUNNING_DISTANCE,
  activeEnergy: APPLE_HEALTH_ANNOTATION_ACTIVE_ENERGY,
  sleepAnalysis: APPLE_HEALTH_ANNOTATION_SLEEP_ANALYSIS,
  heartRate: APPLE_HEALTH_ANNOTATION_HEART_RATE,
  restingHeartRate: APPLE_HEALTH_ANNOTATION_RESTING_HEART_RATE,
  hrv: APPLE_HEALTH_ANNOTATION_HRV,
  respiratoryRate: APPLE_HEALTH_ANNOTATION_RESPIRATORY_RATE,
  spo2: APPLE_HEALTH_ANNOTATION_SPO2,
  skinTemperature: APPLE_HEALTH_ANNOTATION_SKIN_TEMPERATURE,
};
// #endregion
