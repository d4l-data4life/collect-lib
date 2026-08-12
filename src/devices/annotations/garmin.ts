import { DEVICE_SIGNAL_TYPE } from '../types';
import {
  FITBIT_BREATHING_RATE_ANNOTATION,
  FITBIT_CALORIES_ANNOTATION,
  FITBIT_HEART_RATE_ANNOTATION,
  FITBIT_HEART_RATE_VARIABILITY_ANNOTATION,
  FITBIT_SKIN_TEMPERATURE_ANNOTATION,
  FITBIT_SLEEP_ANNOTATION,
  FITBIT_SPO2_ANNOTATION,
  FITBIT_STEPS_ANNOTATION,
} from './fitbit';
import { DEVICE_ANNOTATION_ITEM_RESTING_HEART_RATE } from './base';
import { MENSTRUAL_CYCLE_ANNOTATION } from './menstrual';
import { OURA_STRESS_ANNOTATION } from './oura';
import {
  BLE_CPMS_ANNOTATION_ITEM_DAILY_DISTANCE,
  BLE_CPMS_ANNOTATION_ITEM_DAILY_FLOORS,
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
  type: 'vo2Max',
  size: 8,
  channels: 2,
  channelLabels: ['vo2Max', 'fitnessAge'],
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

// Garmin Health API metrics re-use the shared Fitbit buffer encodings so a study can
// ingest Fitbit, Google Health, Oura and Garmin through the same FHIR pipeline.
// TODO: add body battery / VO2 max once dedicated DEVICE_SIGNAL_TYPEs exist for them.
export const GARMIN_SIGNAL_TYPE_ANNOTATIONS: {
  [key in DEVICE_SIGNAL_TYPE]?: DEVICE_ANNOTATION;
} = {
  heartRate: FITBIT_HEART_RATE_ANNOTATION,
  hrv: FITBIT_HEART_RATE_VARIABILITY_ANNOTATION,
  spo2: FITBIT_SPO2_ANNOTATION,
  sleep: FITBIT_SLEEP_ANNOTATION,
  steps: FITBIT_STEPS_ANNOTATION,
  calories: FITBIT_CALORIES_ANNOTATION,
  respiratoryRate: FITBIT_BREATHING_RATE_ANNOTATION,
  skinTemperature: FITBIT_SKIN_TEMPERATURE_ANNOTATION,
  stress: OURA_STRESS_ANNOTATION,
  menstrualCycle: MENSTRUAL_CYCLE_ANNOTATION,
  // Daily floors climbed: cumulative day total from /dailies (same float32 encoding
  // as the Wear OS daily counter).
  dailyFloors: [BLE_CPMS_ANNOTATION_ITEM_DAILY_FLOORS],
  dailyDistance: [BLE_CPMS_ANNOTATION_ITEM_DAILY_DISTANCE],
  // Shared encoding, without Apple Health's dataSource channel: Garmin has a single
  // source, and pairing them wrote short rows that decoded to nothing.
  restingHeartRate: [DEVICE_ANNOTATION_ITEM_RESTING_HEART_RATE],
  bodyBattery: GARMIN_BODY_BATTERY_ANNOTATION,
  sleepScore: GARMIN_SLEEP_SCORE_ANNOTATION,
  vo2Max: GARMIN_VO2MAX_ANNOTATION,
  bodyComposition: GARMIN_BODY_COMPOSITION_ANNOTATION,
  bloodPressure: GARMIN_BLOOD_PRESSURE_ANNOTATION,
};
