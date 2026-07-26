import { DEVICE_ANNOTATION, DEVICE_ANNOTATION_ITEM } from './types';

// Source-neutral annotation presets shared across data sources (Fitbit, Oura, Garmin,
// Google Health, …). Each entry describes how a signal's samples are laid out in the
// on-device donation buffer. The per-source SIGNAL_TYPE maps (FITBIT_SIGNAL_TYPE_ANNOTATIONS,
// GARMIN_SIGNAL_TYPE_ANNOTATIONS, …) select from these so overlapping signals share one
// buffer encoding and flow through the same FHIR pipeline.

// #region Calories
export const ANNOTATION_ITEM_CALORIES: DEVICE_ANNOTATION_ITEM = {
  type: 'calories',
  size: 4,
  format: 'float32',
  littleEndian: true,
};

export const CALORIES_ANNOTATION: DEVICE_ANNOTATION = [ANNOTATION_ITEM_CALORIES];
// #endregion

// #region Steps
export const ANNOTATION_ITEM_STEPS: DEVICE_ANNOTATION_ITEM = {
  type: 'steps',
  size: 4,
  format: 'unsignedInt',
  littleEndian: true,
};

export const STEPS_ANNOTATION: DEVICE_ANNOTATION = [ANNOTATION_ITEM_STEPS];
// #endregion

// #region Heart Rate
export const ANNOTATION_ITEM_HEART_RATE: DEVICE_ANNOTATION_ITEM = {
  type: 'heartRate',
  size: 1,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'bpm',
};

export const HEART_RATE_ANNOTATION: DEVICE_ANNOTATION = [ANNOTATION_ITEM_HEART_RATE];
// #endregion

// #region Heart Rate Variability
export const ANNOTATION_ITEM_HEART_RATE_VARIABILITY: DEVICE_ANNOTATION_ITEM = {
  type: 'hrv',
  size: 16,
  channels: 4,
  channelLabels: ['rmssd', 'coverage', 'hf', 'lf'],
  format: 'float32',
  littleEndian: true,
};

export const HEART_RATE_VARIABILITY_ANNOTATION: DEVICE_ANNOTATION = [
  ANNOTATION_ITEM_HEART_RATE_VARIABILITY,
];
// #endregion

// #region Breathing Rate
export const ANNOTATION_ITEM_BREATHING_RATE: DEVICE_ANNOTATION_ITEM = {
  type: 'respiratoryRate',
  size: 16,
  channels: 4,
  channelLabels: ['full', 'rem', 'light', 'deep'],
  format: 'float32',
  littleEndian: true,
  unit: 'bpm',
  note: '-1 means not enough data',
};

export const BREATHING_RATE_ANNOTATION: DEVICE_ANNOTATION = [ANNOTATION_ITEM_BREATHING_RATE];
// #endregion

// #region Skin Temperature
export const ANNOTATION_ITEM_SKIN_TEMPERATURE: DEVICE_ANNOTATION_ITEM = {
  type: 'skinTemperature',
  size: 4,
  format: 'float32',
  littleEndian: true,
  unit: '˚C',
  note: 'delta to baseline',
};

export const SKIN_TEMPERATURE_ANNOTATION: DEVICE_ANNOTATION = [ANNOTATION_ITEM_SKIN_TEMPERATURE];
// #endregion

// #region Sleep
export const ANNOTATION_ITEM_SLEEP_LEVEL: DEVICE_ANNOTATION_ITEM = {
  type: 'sleepLevel',
  size: 1,
  format: 'unsignedInt',
  littleEndian: true,
};

export const ANNOTATION_ITEM_SLEEP_LEVEL_DURATION: DEVICE_ANNOTATION_ITEM = {
  type: 'duration',
  size: 2,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 's',
};

export const SLEEP_ANNOTATION: DEVICE_ANNOTATION = [
  ANNOTATION_ITEM_SLEEP_LEVEL,
  ANNOTATION_ITEM_SLEEP_LEVEL_DURATION,
];
// #endregion

// #region SpO2 (Oxygen Saturation)
export const ANNOTATION_ITEM_SPO2: DEVICE_ANNOTATION_ITEM = {
  type: 'spo2',
  size: 4,
  format: 'float32',
  littleEndian: true,
  unit: '%',
};

export const SPO2_ANNOTATION: DEVICE_ANNOTATION = [ANNOTATION_ITEM_SPO2];
// #endregion
