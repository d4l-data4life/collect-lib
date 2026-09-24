import { DEVICE_SIGNAL_TYPE_APPLE } from '../types';
import {
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
  DEVICE_ANNOTATION_ITEM_RESTING_HEART_RATE,
} from './base';
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
// Kept as an alias so existing importers are unaffected; the encoding is shared.
export const APPLE_HEALTH_ANNOTATION_ITEM_RESTING_HEART_RATE: DEVICE_ANNOTATION_ITEM =
  DEVICE_ANNOTATION_ITEM_RESTING_HEART_RATE;

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

// #region Workout (HKWorkout — activity type, duration, optional system-estimated effort)
// All channels are unsigned 32-bit. `activityType` is HKWorkoutActivityType; `duration` is
// seconds; `effort` is 1–10 when available, else 0.
export const APPLE_HEALTH_ANNOTATION_ITEM_WORKOUT: DEVICE_ANNOTATION_ITEM = {
  type: 'workout',
  size: 12,
  channels: 3,
  channelLabels: ['activityType', 'duration', 'effort'],
  format: 'unsignedInt',
  littleEndian: true,
  note: 'activityType is HKWorkoutActivityType; duration in s; effort 0 when not provided (1–10)',
};

export const APPLE_HEALTH_ANNOTATION_WORKOUT: DEVICE_ANNOTATION = [
  APPLE_HEALTH_ANNOTATION_ITEM_WORKOUT,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];
// #endregion

// #region Stand Hours (one row per clock hour)
// HealthKit CategoryValueAppleStandHour: stood = 0, idle = 1. Stored as boolean: true if stood.
export const APPLE_HEALTH_ANNOTATION_ITEM_STAND_HOUR_STATE: DEVICE_ANNOTATION_ITEM = {
  type: 'stoodDuringHour',
  size: 1,
  format: 'boolean',
  littleEndian: true,
  note: 'true if the user stood during that hour (HKCategoryValueAppleStandHour.stood)',
};

export const APPLE_HEALTH_ANNOTATION_STAND_HOURS: DEVICE_ANNOTATION = [
  APPLE_HEALTH_ANNOTATION_ITEM_STAND_HOUR_STATE,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];
// #endregion

// #region Activity Summary (HKActivitySummary — daily Move / Exercise / Stand rings)
// One snapshot per calendar day. All channels are unsigned 32-bit. Energy in
// whole kcal; time in min; stand in hour counts. moveMode is HKActivityMoveMode:
// 1 = Move ring tracks activeEnergy (kcal, default 18+); 2 = appleMoveTime (min, under-13 / teen option).
export const APPLE_HEALTH_ANNOTATION_ITEM_ACTIVITY_SUMMARY: DEVICE_ANNOTATION_ITEM = {
  type: 'activitySummary',
  size: 36,
  channels: 9,
  channelLabels: [
    'activeEnergy',
    'activeEnergyGoal',
    'exerciseTime',
    'exerciseTimeGoal',
    'standHours',
    'standHoursGoal',
    'moveMode',
    'moveTime',
    'moveTimeGoal',
  ],
  format: 'unsignedInt',
  littleEndian: true,
  note: 'activeEnergy* in whole kcal; *Time* in min; standHours* as count; moveMode: 1=activeEnergy (kcal Move ring), 2=appleMoveTime (min Move ring)',
};

export const APPLE_HEALTH_ANNOTATION_ACTIVITY_SUMMARY: DEVICE_ANNOTATION = [
  APPLE_HEALTH_ANNOTATION_ITEM_ACTIVITY_SUMMARY,
];
// #endregion

// #region Menstrual Cycle (HKCategoryTypeIdentifierMenstrualFlow)
// One user-logged observation. `state` is HealthKit CategoryValueMenstrualFlow;
// `isCycleStart` is 1 when HKMetadataKeyMenstrualCycleStart is true, else 0.
export const APPLE_HEALTH_ANNOTATION_ITEM_MENSTRUAL_CYCLE: DEVICE_ANNOTATION_ITEM = {
  type: 'menstrualCycle',
  size: 2,
  channels: 2,
  channelLabels: ['state', 'isCycleStart'],
  format: 'unsignedInt',
  littleEndian: true,
};

export const APPLE_HEALTH_ANNOTATION_MENSTRUAL_CYCLE: DEVICE_ANNOTATION = [
  APPLE_HEALTH_ANNOTATION_ITEM_MENSTRUAL_CYCLE,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];
// #endregion

// #region Contraceptive
export const APPLE_HEALTH_ANNOTATION_ITEM_CONTRACEPTIVE_TYPE: DEVICE_ANNOTATION_ITEM = {
  type: 'contraceptiveType',
  size: 1,
  format: 'unsignedInt',
  littleEndian: true,
};

export const APPLE_HEALTH_ANNOTATION_CONTRACEPTIVE: DEVICE_ANNOTATION = [
  APPLE_HEALTH_ANNOTATION_ITEM_CONTRACEPTIVE_TYPE,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];
// #endregion

// #region Pregnancy
/**
 * Apple Health pregnancy cycle factor (HKCategoryValue.notApplicable).
 * The mobile app stores true for each active pregnancy sample.
 */
export const APPLE_HEALTH_ANNOTATION_ITEM_PREGNANCY_STATE: DEVICE_ANNOTATION_ITEM = {
  type: 'pregnancyState',
  size: 1,
  format: 'boolean',
  littleEndian: true,
};

export const APPLE_HEALTH_ANNOTATION_PREGNANCY: DEVICE_ANNOTATION = [
  APPLE_HEALTH_ANNOTATION_ITEM_PREGNANCY_STATE,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];
// #endregion

// #region Lactation
/**
 * Apple Health lactation cycle factor (HKCategoryValue.notApplicable).
 * The mobile app stores true for each active lactation sample.
 */
export const APPLE_HEALTH_ANNOTATION_ITEM_LACTATION_STATE: DEVICE_ANNOTATION_ITEM = {
  type: 'lactationState',
  size: 1,
  format: 'boolean',
  littleEndian: true,
};

export const APPLE_HEALTH_ANNOTATION_LACTATION: DEVICE_ANNOTATION = [
  APPLE_HEALTH_ANNOTATION_ITEM_LACTATION_STATE,
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
  workout: APPLE_HEALTH_ANNOTATION_WORKOUT,
  standHours: APPLE_HEALTH_ANNOTATION_STAND_HOURS,
  activitySummary: APPLE_HEALTH_ANNOTATION_ACTIVITY_SUMMARY,
  menstrualCycle: APPLE_HEALTH_ANNOTATION_MENSTRUAL_CYCLE,
  contraceptive: APPLE_HEALTH_ANNOTATION_CONTRACEPTIVE,
  pregnancy: APPLE_HEALTH_ANNOTATION_PREGNANCY,
  lactation: APPLE_HEALTH_ANNOTATION_LACTATION,
};
// #endregion
