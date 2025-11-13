import { DEVICE_SIGNAL_TYPE } from '../types';
import { DEVICE_ANNOTATION, DEVICE_ANNOTATION_ITEM } from './types';

// #region Step Count
export const APPLE_HEALTH_ANNOTATION_ITEM_STEP_COUNT: DEVICE_ANNOTATION_ITEM = {
  type: 'stepCount',
  size: 4,
  format: 'signedInt',
  littleEndian: true,
};

export const APPLE_HEALTH_STEP_COUNT_ANNOTATION: DEVICE_ANNOTATION = [
  APPLE_HEALTH_ANNOTATION_ITEM_STEP_COUNT,
];
// #endregion

// #region Walking and Running Distance
export const APPLE_HEALTH_ANNOTATION_ITEM_WALKING_RUNNING_DISTANCE: DEVICE_ANNOTATION_ITEM = {
  type: 'walkingAndRunningDistance',
  size: 4,
  format: 'float32',
  littleEndian: true,
};

export const APPLE_HEALTH_WALKING_RUNNING_DISTANCE_ANNOTATION: DEVICE_ANNOTATION = [
  APPLE_HEALTH_ANNOTATION_ITEM_WALKING_RUNNING_DISTANCE,
];
// #endregion

// #region Active Energy
export const APPLE_HEALTH_ANNOTATION_ITEM_ACTIVE_ENERGY: DEVICE_ANNOTATION_ITEM = {
  type: 'activeEnergy',
  size: 4,
  format: 'float32',
  littleEndian: true,
};

export const APPLE_HEALTH_ACTIVE_ENERGY_ANNOTATION: DEVICE_ANNOTATION = [
  APPLE_HEALTH_ANNOTATION_ITEM_ACTIVE_ENERGY,
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

export const APPLE_HEALTH_SLEEP_ANALYSIS_ANNOTATION: DEVICE_ANNOTATION = [
  APPLE_HEALTH_ANNOTATION_ITEM_SLEEP_STATE,
  APPLE_HEALTH_ANNOTATION_ITEM_SLEEP_DURATION,
];
// #endregion

// #region Signal Type Annotations
export const APPLE_HEALTH_SIGNAL_TYPE_ANNOTATIONS: {
  [key in DEVICE_SIGNAL_TYPE]?: DEVICE_ANNOTATION;
} = {
  stepCount: APPLE_HEALTH_STEP_COUNT_ANNOTATION,
  walkingAndRunningDistance: APPLE_HEALTH_WALKING_RUNNING_DISTANCE_ANNOTATION,
  activeEnergy: APPLE_HEALTH_ACTIVE_ENERGY_ANNOTATION,
  sleepAnalysis: APPLE_HEALTH_SLEEP_ANALYSIS_ANNOTATION,
};
// #endregion
