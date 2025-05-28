import { DEVICE_SIGNAL_TYPE } from '../types';
import { DEVICE_ANNOTATION, DEVICE_ANNOTATION_ITEM } from './types';

// #region Calories
export const FITBIT_ANNOTATION_ITEM_CALORIES: DEVICE_ANNOTATION_ITEM = {
  type: 'calories',
  size: 4,
  format: 'float32',
  littleEndian: true,
};

export const FITBIT_CALORIES_ANNOTATION: DEVICE_ANNOTATION = [FITBIT_ANNOTATION_ITEM_CALORIES];
// #endregion

// #region Steps
export const FITBIT_ANNOTATION_ITEM_STEPS: DEVICE_ANNOTATION_ITEM = {
  type: 'steps',
  size: 4,
  format: 'unsignedInt',
  littleEndian: true,
};

export const FITBIT_STEPS_ANNOTATION: DEVICE_ANNOTATION = [FITBIT_ANNOTATION_ITEM_STEPS];
// #endregion

// #region Heart Rate
export const FITBIT_ANNOTATION_ITEM_HEART_RATE: DEVICE_ANNOTATION_ITEM = {
  type: 'heartRate',
  size: 1,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'bpm',
};

export const FITBIT_HEART_RATE_ANNOTATION: DEVICE_ANNOTATION = [FITBIT_ANNOTATION_ITEM_HEART_RATE];
// #endregion

// #region Heart Rate Variability
export const FITBIT_ANNOTATION_ITEM_HEART_RATE_VARIABILITY: DEVICE_ANNOTATION_ITEM = {
  type: 'hrv',
  size: 16,
  channels: 4,
  channelLabels: ['rmssd', 'coverage', 'hf', 'lf'],
  format: 'float32',
  littleEndian: true,
};

export const FITBIT_HEART_RATE_VARIABILITY_ANNOTATION: DEVICE_ANNOTATION = [
  FITBIT_ANNOTATION_ITEM_HEART_RATE_VARIABILITY,
];
// #endregion

// #region Breathing Rate
export const FITBIT_ANNOTATION_ITEM_BREATHING_RATE: DEVICE_ANNOTATION_ITEM = {
  type: 'respiratoryRate',
  size: 16,
  channels: 4,
  channelLabels: ['full', 'rem', 'light', 'deep'],
  format: 'float32',
  littleEndian: true,
  unit: 'bpm',
  note: '-1 means not enough data',
};

export const FITBIT_BREATHING_RATE_ANNOTATION: DEVICE_ANNOTATION = [
  FITBIT_ANNOTATION_ITEM_BREATHING_RATE,
];
// #endregion

// #region Skin Temperature
export const FITBIT_ANNOTATION_ITEM_SKIN_TEMPERATURE: DEVICE_ANNOTATION_ITEM = {
  type: 'skinTemperature',
  size: 4,
  format: 'float32',
  littleEndian: true,
  unit: '˚C',
  note: 'delta to baseline',
};

export const FITBIT_SKIN_TEMPERATURE_ANNOTATION: DEVICE_ANNOTATION = [
  FITBIT_ANNOTATION_ITEM_SKIN_TEMPERATURE,
];
// #endregion

// #region Sleep
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

export const FITBIT_ANNOTATION_ITEM_SLEEP_LEVEL: DEVICE_ANNOTATION_ITEM = {
  type: 'sleepLevel',
  size: 1,
  format: 'unsignedInt',
  littleEndian: true,
};

export const FITBIT_ANNOTATION_ITEM_SLEEP_LEVEL_DURATION: DEVICE_ANNOTATION_ITEM = {
  type: 'duration',
  size: 2,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 's',
};

export const FITBIT_SLEEP_ANNOTATION: DEVICE_ANNOTATION = [
  FITBIT_ANNOTATION_ITEM_SLEEP_LEVEL,
  FITBIT_ANNOTATION_ITEM_SLEEP_LEVEL_DURATION,
];
// #endregion

// #region SpO2 (Oxygen Saturation)
export const FITBIT_ANNOTATION_ITEM_SPO2: DEVICE_ANNOTATION_ITEM = {
  type: 'spo2',
  size: 4,
  format: 'float32',
  littleEndian: true,
  unit: '%',
};

export const FITBIT_SPO2_ANNOTATION: DEVICE_ANNOTATION = [FITBIT_ANNOTATION_ITEM_SPO2];
// #endregion

export const FITBIT_SIGNAL_TYPE_ANNOTATIONS: { [key in DEVICE_SIGNAL_TYPE]?: DEVICE_ANNOTATION } = {
  calories: FITBIT_CALORIES_ANNOTATION,
  steps: FITBIT_STEPS_ANNOTATION,
  heartRate: FITBIT_HEART_RATE_ANNOTATION,
  hrv: FITBIT_HEART_RATE_VARIABILITY_ANNOTATION,
  respiratoryRate: FITBIT_BREATHING_RATE_ANNOTATION,
  skinTemperature: FITBIT_SKIN_TEMPERATURE_ANNOTATION,
  sleep: FITBIT_SLEEP_ANNOTATION,
  spo2: FITBIT_SPO2_ANNOTATION,
};
