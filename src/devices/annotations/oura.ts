import { DEVICE_SIGNAL_TYPE } from '../types';
import {
  DEVICE_ANNOTATION_HRV_RMSSD,
  DEVICE_ANNOTATION_ITEM_DAILY_STEPS_TOTAL,
  DEVICE_ANNOTATION_ITEM_DAILY_CALORIES_TOTAL,
  DEVICE_ANNOTATION_SKIN_TEMPERATURE_DEVIATION,
} from './base';
import {
  FITBIT_BREATHING_RATE_ANNOTATION,
  FITBIT_HEART_RATE_ANNOTATION,
  FITBIT_SLEEP_ANNOTATION,
  FITBIT_SPO2_ANNOTATION,
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

// #region Cardiovascular Age / Heart Health (daily_cardiovascular_age)
export const OURA_ANNOTATION_ITEM_CARDIOVASCULAR_AGE: DEVICE_ANNOTATION_ITEM = {
  type: 'cardiovascularAge',
  size: 8,
  channels: 2,
  channelLabels: ['vascularAge', 'pulseWaveVelocity'],
  format: 'float32',
  littleEndian: true,
  note: 'vascularAge in years [18,100]; pulseWaveVelocity in m/s (NaN if unavailable)',
};

export const OURA_CARDIOVASCULAR_AGE_ANNOTATION: DEVICE_ANNOTATION = [
  OURA_ANNOTATION_ITEM_CARDIOVASCULAR_AGE,
];
// #endregion

// #region Activity (daily_activity.class_5_min — 5-minute activity classification)
// One byte per 5-minute bucket: the activity level is a single uint8 (0–5). The bucket
// start time is the item's timestamp and the 5-minute cadence is fixed, so no duration
// channel is stored. Level 0 explicitly marks ring non-wear.
export const OURA_ANNOTATION_ITEM_ACTIVITY_LEVEL: DEVICE_ANNOTATION_ITEM = {
  type: 'activityLevel',
  size: 1,
  format: 'unsignedInt',
  littleEndian: true,
  note: '0=non-wear, 1=rest, 2=inactive, 3=low, 4=medium, 5=high activity',
};

export const OURA_ACTIVITY_ANNOTATION: DEVICE_ANNOTATION = [OURA_ANNOTATION_ITEM_ACTIVITY_LEVEL];
// #endregion

// #region Ring battery level (ring_battery_level — discrete % samples)
// A single uint8 byte per sample: ring battery percentage in [0, 100].
export const OURA_ANNOTATION_ITEM_BATTERY_LEVEL: DEVICE_ANNOTATION_ITEM = {
  type: 'batteryLevel',
  size: 1,
  format: 'unsignedInt',
  littleEndian: true,
  unit: '%',
};

export const OURA_BATTERY_LEVEL_ANNOTATION: DEVICE_ANNOTATION = [
  OURA_ANNOTATION_ITEM_BATTERY_LEVEL,
];
// #endregion

// Overlapping signals re-use Fitbit's buffer encoding so a study can ingest data
// from Fitbit, Google Health and Oura through the same FHIR pipeline.
export const OURA_SIGNAL_TYPE_ANNOTATIONS: {
  [key in DEVICE_SIGNAL_TYPE]?: DEVICE_ANNOTATION;
} = {
  // Oura only exposes one value per completed day; total_calories includes the resting burn.
  dailyCaloriesTotal: [DEVICE_ANNOTATION_ITEM_DAILY_CALORIES_TOTAL],
  dailyStepsTotal: [DEVICE_ANNOTATION_ITEM_DAILY_STEPS_TOTAL],
  heartRate: FITBIT_HEART_RATE_ANNOTATION,
  hrvRmssd: DEVICE_ANNOTATION_HRV_RMSSD,
  respiratoryRate: FITBIT_BREATHING_RATE_ANNOTATION,
  skinTemperatureDeviation: DEVICE_ANNOTATION_SKIN_TEMPERATURE_DEVIATION,
  sleep: FITBIT_SLEEP_ANNOTATION,
  spo2: FITBIT_SPO2_ANNOTATION,
  stress: OURA_STRESS_ANNOTATION,
  workout: OURA_WORKOUT_ANNOTATION,
  tag: OURA_TAG_ANNOTATION,
  cardiovascularAge: OURA_CARDIOVASCULAR_AGE_ANNOTATION,
  activity: OURA_ACTIVITY_ANNOTATION,
  batteryLevel: OURA_BATTERY_LEVEL_ANNOTATION,
};
