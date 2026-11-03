import { DEVICE_SIGNAL_TYPE } from '../types';
import {
  FITBIT_BREATHING_RATE_ANNOTATION,
  FITBIT_HEART_RATE_ANNOTATION,
  FITBIT_SLEEP_ANNOTATION,
  FITBIT_SPO2_ANNOTATION,
} from './fitbit';
import {
  DEVICE_ANNOTATION_HRV_RMSSD,
  DEVICE_ANNOTATION_ITEM_RESTING_HEART_RATE,
  DEVICE_ANNOTATION_SKIN_TEMPERATURE_DEVIATION,
} from './base';
import { MENSTRUAL_CYCLE_ANNOTATION } from './menstrual';
import { OURA_STRESS_ANNOTATION } from './oura';
import {
  BLE_CPMS_ANNOTATION_ITEM_DAILY_CALORIES,
  BLE_CPMS_ANNOTATION_ITEM_DAILY_DISTANCE,
  BLE_CPMS_ANNOTATION_ITEM_DAILY_FLOORS,
  BLE_CPMS_ANNOTATION_ITEM_DAILY_STEPS,
} from './wearOS3';
import { DEVICE_ANNOTATION, DEVICE_ANNOTATION_ITEM } from './types';

// Body Battery: Garmin's 0-100 energy level, sampled alongside stress
// (stressDetails.timeOffsetBodyBatteryValues).
export const GARMIN_ANNOTATION_ITEM_BODY_BATTERY: DEVICE_ANNOTATION_ITEM = {
  type: 'bodyBattery',
  size: 1,
  format: 'unsignedInt',
  note: 'charge level 0-100',
};
export const GARMIN_BODY_BATTERY_ANNOTATION: DEVICE_ANNOTATION = [
  GARMIN_ANNOTATION_ITEM_BODY_BATTERY,
];

// Overall sleep score (0-100), one per sleep summary, anchored at wake.
export const GARMIN_ANNOTATION_ITEM_SLEEP_SCORE: DEVICE_ANNOTATION_ITEM = {
  type: 'sleepScore',
  size: 1,
  format: 'unsignedInt',
  note: 'overall sleep score 0-100',
};
export const GARMIN_SLEEP_SCORE_ANNOTATION: DEVICE_ANNOTATION = [
  GARMIN_ANNOTATION_ITEM_SLEEP_SCORE,
];

// VO2 max + fitness age from userMetrics summaries (per calendar day).
export const GARMIN_ANNOTATION_ITEM_VO2MAX: DEVICE_ANNOTATION_ITEM = {
  type: 'vo2max',
  size: 8,
  channels: 2,
  channelLabels: ['vo2max', 'fitnessAge'],
  format: 'float32',
  littleEndian: true,
  note: '-1 means not provided',
};
export const GARMIN_VO2MAX_ANNOTATION: DEVICE_ANNOTATION = [GARMIN_ANNOTATION_ITEM_VO2MAX];

// Body composition from bodyComps summaries (smart scale measurements).
export const GARMIN_ANNOTATION_ITEM_BODY_COMPOSITION: DEVICE_ANNOTATION_ITEM = {
  type: 'bodyComposition',
  size: 24,
  channels: 6,
  channelLabels: [
    'weightInGrams',
    'bodyMassIndex',
    'bodyFatInPercent',
    'muscleMassInGrams',
    'boneMassInGrams',
    'bodyWaterInPercent',
  ],
  format: 'float32',
  littleEndian: true,
  note: '-1 means not provided',
};
export const GARMIN_BODY_COMPOSITION_ANNOTATION: DEVICE_ANNOTATION = [
  GARMIN_ANNOTATION_ITEM_BODY_COMPOSITION,
];

// Blood pressure readings (manual or linked cuff).
export const GARMIN_ANNOTATION_ITEM_BLOOD_PRESSURE: DEVICE_ANNOTATION_ITEM = {
  type: 'bloodPressure',
  size: 6,
  channels: 3,
  channelLabels: ['systolic', 'diastolic', 'pulse'],
  format: 'signedInt',
  littleEndian: true,
  unit: 'mmHg / bpm',
  note: '-1 means not provided',
};
export const GARMIN_BLOOD_PRESSURE_ANNOTATION: DEVICE_ANNOTATION = [
  GARMIN_ANNOTATION_ITEM_BLOOD_PRESSURE,
];

// Activity epochs (/epochs): 15-minute monitoring windows, one item per epoch,
// anchored at the epoch start. A window split across activity types arrives as one
// epoch per type (same timestamp, own active time). The level uses Garmin's own
// 3-step intensity — deliberately not Oura's 0-5 scale; each device documents its own.
export const GARMIN_ANNOTATION_ITEM_ACTIVITY_LEVEL: DEVICE_ANNOTATION_ITEM = {
  type: 'activityLevel',
  size: 1,
  format: 'unsignedInt',
  note: '0=sedentary, 1=active, 2=highly active (Garmin epoch intensity)',
};
export const GARMIN_ANNOTATION_ITEM_ACTIVITY_METS: DEVICE_ANNOTATION_ITEM = {
  type: 'averageMetabolicEquivalent',
  size: 4,
  format: 'float32',
  littleEndian: true,
  unit: 'MET',
  note: 'average METs over the epoch; 0 when Garmin sent none',
};
export const GARMIN_ANNOTATION_ITEM_ACTIVITY_ACTIVE_TIME: DEVICE_ANNOTATION_ITEM = {
  type: 'duration',
  size: 2,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 's',
  note: 'active seconds within the 15-minute epoch',
};
export const GARMIN_ACTIVITY_ANNOTATION: DEVICE_ANNOTATION = [
  GARMIN_ANNOTATION_ITEM_ACTIVITY_LEVEL,
  GARMIN_ANNOTATION_ITEM_ACTIVITY_METS,
  GARMIN_ANNOTATION_ITEM_ACTIVITY_ACTIVE_TIME,
];

// Garmin Health API metrics re-use the shared Fitbit buffer encodings so a study can
// ingest Fitbit, Google Health, Oura and Garmin through the same FHIR pipeline.
// TODO: add body battery / VO2 max once dedicated DEVICE_SIGNAL_TYPEs exist for them.
export const GARMIN_SIGNAL_TYPE_ANNOTATIONS: {
  [key in DEVICE_SIGNAL_TYPE]?: DEVICE_ANNOTATION;
} = {
  heartRate: FITBIT_HEART_RATE_ANNOTATION,
  hrvRmssd: DEVICE_ANNOTATION_HRV_RMSSD,
  spo2: FITBIT_SPO2_ANNOTATION,
  sleep: FITBIT_SLEEP_ANNOTATION,
  // Running day total from /dailies, re-sent with every sync.
  dailySteps: [BLE_CPMS_ANNOTATION_ITEM_DAILY_STEPS],
  // Running day total of activeKilocalories + bmrKilocalories, i.e. total burn.
  dailyCalories: [BLE_CPMS_ANNOTATION_ITEM_DAILY_CALORIES],
  respiratoryRate: FITBIT_BREATHING_RATE_ANNOTATION,
  skinTemperatureDeviation: DEVICE_ANNOTATION_SKIN_TEMPERATURE_DEVIATION,
  stress: OURA_STRESS_ANNOTATION,
  menstrualCycle: MENSTRUAL_CYCLE_ANNOTATION,
  // Daily floors climbed: cumulative day total from /dailies (same float32 encoding
  // as the Wear OS daily counter).
  dailyFloors: [BLE_CPMS_ANNOTATION_ITEM_DAILY_FLOORS],
  dailyDistance: [BLE_CPMS_ANNOTATION_ITEM_DAILY_DISTANCE],
  restingHeartRate: [DEVICE_ANNOTATION_ITEM_RESTING_HEART_RATE],
  bodyBattery: GARMIN_BODY_BATTERY_ANNOTATION,
  sleepScore: GARMIN_SLEEP_SCORE_ANNOTATION,
  vo2max: GARMIN_VO2MAX_ANNOTATION,
  bodyComposition: GARMIN_BODY_COMPOSITION_ANNOTATION,
  bloodPressure: GARMIN_BLOOD_PRESSURE_ANNOTATION,
  activity: GARMIN_ACTIVITY_ANNOTATION,
};
