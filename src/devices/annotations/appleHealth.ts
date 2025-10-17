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

// #region Signal Type Annotations
export const APPLE_HEALTH_SIGNAL_TYPE_ANNOTATIONS: {
  [key in DEVICE_SIGNAL_TYPE]?: DEVICE_ANNOTATION;
} = {
  stepCount: APPLE_HEALTH_STEP_COUNT_ANNOTATION,
  walkingAndRunningDistance: APPLE_HEALTH_WALKING_RUNNING_DISTANCE_ANNOTATION,
  activeEnergy: APPLE_HEALTH_ACTIVE_ENERGY_ANNOTATION,
};
// #endregion
