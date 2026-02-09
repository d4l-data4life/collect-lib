import { DEVICE_SIGNAL_TYPE } from '../types';
import { DEVICE_ANNOTATION, DEVICE_ANNOTATION_ITEM } from './types';

// #region Steps
export const HEALTH_CONNECT_ANNOTATION_ITEM_STEPS: DEVICE_ANNOTATION_ITEM = {
  type: 'steps',
  size: 4,
  format: 'signedInt',
  littleEndian: true,
};

export const HEALTH_CONNECT_STEPS_ANNOTATION: DEVICE_ANNOTATION = [
  HEALTH_CONNECT_ANNOTATION_ITEM_STEPS,
];
// #endregion

// #region Sleep

export type HealthConnectSleepStages =
  | 'unknown'
  | 'awake'
  | 'sleeping'
  | 'awakeOutOfBed'
  | 'sleepingLight'
  | 'sleepingDeep'
  | 'sleepingRem'
  | 'awakeInBed';

export const HEALTH_CONNECT_SLEEP_STAGE_MAP: { [key in HealthConnectSleepStages]: number } = {
  unknown: 0,
  awake: 1,
  sleeping: 2,
  awakeOutOfBed: 3,
  sleepingLight: 4,
  sleepingDeep: 5,
  sleepingRem: 6,
  awakeInBed: 7,
};

export const HEALTH_CONNECT_ANNOTATION_ITEM_SLEEP_STAGE: DEVICE_ANNOTATION_ITEM = {
  type: 'sleepStage',
  size: 1,
  format: 'unsignedInt',
  littleEndian: true,
};

export const HEALTH_CONNECT_ANNOTATION_ITEM_SLEEP_DURATION: DEVICE_ANNOTATION_ITEM = {
  type: 'duration',
  size: 2,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 's',
};

export const HEALTH_CONNECT_SLEEP_ANNOTATION: DEVICE_ANNOTATION = [
  HEALTH_CONNECT_ANNOTATION_ITEM_SLEEP_STAGE,
  HEALTH_CONNECT_ANNOTATION_ITEM_SLEEP_DURATION,
];
// #endregion

// #region Signal Type Annotations
export const HEALTH_CONNECT_SIGNAL_TYPE_ANNOTATIONS: {
  [key in DEVICE_SIGNAL_TYPE]?: DEVICE_ANNOTATION;
} = {
  steps: HEALTH_CONNECT_STEPS_ANNOTATION,
  sleep: HEALTH_CONNECT_SLEEP_ANNOTATION,
};
// #endregion
