import { DEVICE_SIGNAL_TYPE } from '../types';
import {
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
  DEVICE_ANNOTATION_ITEM_RESTING_HEART_RATE,
} from './base';
import {
  FITBIT_ANNOTATION_ITEM_BREATHING_RATE,
  FITBIT_ANNOTATION_ITEM_CALORIES,
  FITBIT_ANNOTATION_ITEM_HEART_RATE,
  FITBIT_ANNOTATION_ITEM_HEART_RATE_VARIABILITY,
  FITBIT_ANNOTATION_ITEM_SKIN_TEMPERATURE,
  FITBIT_ANNOTATION_ITEM_SLEEP_LEVEL,
  FITBIT_ANNOTATION_ITEM_SLEEP_LEVEL_DURATION,
  FITBIT_ANNOTATION_ITEM_SPO2,
  FITBIT_ANNOTATION_ITEM_STEPS,
} from './fitbit';
import { DEVICE_ANNOTATION, DEVICE_ANNOTATION_ITEM } from './types';

// Every Google Health item ends with the source it was read from (GoogleHealthDataSource
// in dataSource.ts): `list` names the device per point, so a phone and a watch tracking
// the same minutes arrive as two items, while `dataPoints:reconcile` merges the sources
// and its points are labelled `reconciled`.
const DATA_SOURCE = DEVICE_ANNOTATION_ITEM_DATA_SOURCE;

// Length of the observed interval in seconds. Google's intervals are not fixed-width (a
// 1-minute step bucket next to a 15-minute activity window), so every interval signal
// carries it; the item's timestamp is the interval start.
export const GOOGLE_HEALTH_ANNOTATION_ITEM_DURATION: DEVICE_ANNOTATION_ITEM = {
  type: 'duration',
  size: 4,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 's',
  note: 'length of the observed interval',
};

// #region Fitbit-era signals (calories, steps, heart rate, HRV, breathing rate, skin
// temperature, sleep, SpO2) — the value items are Fitbit's, so the two sources stay
// comparable; Google adds the data source and, for the interval signals, the duration.
export const GOOGLE_HEALTH_CALORIES_ANNOTATION: DEVICE_ANNOTATION = [
  FITBIT_ANNOTATION_ITEM_CALORIES,
  GOOGLE_HEALTH_ANNOTATION_ITEM_DURATION,
  DATA_SOURCE,
];

export const GOOGLE_HEALTH_STEPS_ANNOTATION: DEVICE_ANNOTATION = [
  FITBIT_ANNOTATION_ITEM_STEPS,
  GOOGLE_HEALTH_ANNOTATION_ITEM_DURATION,
  DATA_SOURCE,
];

export const GOOGLE_HEALTH_HEART_RATE_ANNOTATION: DEVICE_ANNOTATION = [
  FITBIT_ANNOTATION_ITEM_HEART_RATE,
  DATA_SOURCE,
];

export const GOOGLE_HEALTH_HEART_RATE_VARIABILITY_ANNOTATION: DEVICE_ANNOTATION = [
  FITBIT_ANNOTATION_ITEM_HEART_RATE_VARIABILITY,
  DATA_SOURCE,
];

export const GOOGLE_HEALTH_BREATHING_RATE_ANNOTATION: DEVICE_ANNOTATION = [
  FITBIT_ANNOTATION_ITEM_BREATHING_RATE,
  DATA_SOURCE,
];

export const GOOGLE_HEALTH_SKIN_TEMPERATURE_ANNOTATION: DEVICE_ANNOTATION = [
  FITBIT_ANNOTATION_ITEM_SKIN_TEMPERATURE,
  DATA_SOURCE,
];

export const GOOGLE_HEALTH_SLEEP_ANNOTATION: DEVICE_ANNOTATION = [
  FITBIT_ANNOTATION_ITEM_SLEEP_LEVEL,
  FITBIT_ANNOTATION_ITEM_SLEEP_LEVEL_DURATION,
  DATA_SOURCE,
];

export const GOOGLE_HEALTH_SPO2_ANNOTATION: DEVICE_ANNOTATION = [
  FITBIT_ANNOTATION_ITEM_SPO2,
  DATA_SOURCE,
];
// #endregion

// #region Resting heart rate (daily-resting-heart-rate)
export const GOOGLE_HEALTH_RESTING_HEART_RATE_ANNOTATION: DEVICE_ANNOTATION = [
  DEVICE_ANNOTATION_ITEM_RESTING_HEART_RATE,
  DATA_SOURCE,
];
// #endregion

// #region Distance / floors / elevation gain (distance, floors, altitude)
// Per-interval increments exactly as Google delivers them, anchored at the interval start
// — not day totals (those are the `daily*` types of the Wear OS counters and Garmin's
// dailies). Google serves `floors` only merged across sources (`dataPoints:reconcile`),
// the other two per source.
export const GOOGLE_HEALTH_ANNOTATION_ITEM_DISTANCE: DEVICE_ANNOTATION_ITEM = {
  type: 'distance',
  size: 4,
  format: 'float32',
  littleEndian: true,
  unit: 'm',
  note: 'distance covered in the interval',
};

export const GOOGLE_HEALTH_ANNOTATION_ITEM_FLOORS: DEVICE_ANNOTATION_ITEM = {
  type: 'floors',
  size: 2,
  format: 'unsignedInt',
  littleEndian: true,
  note: 'floors climbed in the interval',
};

export const GOOGLE_HEALTH_ANNOTATION_ITEM_ELEVATION_GAIN: DEVICE_ANNOTATION_ITEM = {
  type: 'elevationGain',
  size: 4,
  format: 'float32',
  littleEndian: true,
  unit: 'm',
  note: 'altitude gained in the interval (deltas, not height above sea level)',
};

export const GOOGLE_HEALTH_DISTANCE_ANNOTATION: DEVICE_ANNOTATION = [
  GOOGLE_HEALTH_ANNOTATION_ITEM_DISTANCE,
  GOOGLE_HEALTH_ANNOTATION_ITEM_DURATION,
  DATA_SOURCE,
];

export const GOOGLE_HEALTH_FLOORS_ANNOTATION: DEVICE_ANNOTATION = [
  GOOGLE_HEALTH_ANNOTATION_ITEM_FLOORS,
  GOOGLE_HEALTH_ANNOTATION_ITEM_DURATION,
  DATA_SOURCE,
];

export const GOOGLE_HEALTH_ELEVATION_GAIN_ANNOTATION: DEVICE_ANNOTATION = [
  GOOGLE_HEALTH_ANNOTATION_ITEM_ELEVATION_GAIN,
  GOOGLE_HEALTH_ANNOTATION_ITEM_DURATION,
  DATA_SOURCE,
];
// #endregion

// #region Active Zone Minutes (active-zone-minutes)
// One item per Google interval. Minutes are earned per heart-rate zone (fat burn counts
// 1×, cardio and peak 2× — Fitbit's AZM rule), so one window can arrive as several items
// sharing a timestamp, one per zone.
export const GOOGLE_HEALTH_ANNOTATION_ITEM_HEART_RATE_ZONE: DEVICE_ANNOTATION_ITEM = {
  type: 'heartRateZone',
  size: 1,
  format: 'unsignedInt',
  note: '0=unspecified, 1=fat burn, 2=cardio, 3=peak',
};

export const GOOGLE_HEALTH_ANNOTATION_ITEM_ACTIVE_ZONE_MINUTES: DEVICE_ANNOTATION_ITEM = {
  type: 'activeZoneMinutes',
  size: 2,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'min',
};

export const GOOGLE_HEALTH_ACTIVE_ZONE_MINUTES_ANNOTATION: DEVICE_ANNOTATION = [
  GOOGLE_HEALTH_ANNOTATION_ITEM_HEART_RATE_ZONE,
  GOOGLE_HEALTH_ANNOTATION_ITEM_ACTIVE_ZONE_MINUTES,
  GOOGLE_HEALTH_ANNOTATION_ITEM_DURATION,
  DATA_SOURCE,
];
// #endregion

// #region Activity level (activity-level)
// One item per Google interval. The level uses Google's own 4-step scale — deliberately
// not Oura's 0-5 or Garmin's 0-2; each device documents its own.
export const GOOGLE_HEALTH_ANNOTATION_ITEM_ACTIVITY_LEVEL: DEVICE_ANNOTATION_ITEM = {
  type: 'activityLevel',
  size: 1,
  format: 'unsignedInt',
  note: '0=sedentary, 1=lightly active, 2=moderately active, 3=very active (Google Health activity level)',
};

export const GOOGLE_HEALTH_ACTIVITY_ANNOTATION: DEVICE_ANNOTATION = [
  GOOGLE_HEALTH_ANNOTATION_ITEM_ACTIVITY_LEVEL,
  GOOGLE_HEALTH_ANNOTATION_ITEM_DURATION,
  DATA_SOURCE,
];
// #endregion

// #region VO2 max (daily-vo2-max — Fitbit's Cardio Fitness Score, one per day)
export const GOOGLE_HEALTH_ANNOTATION_ITEM_VO2MAX: DEVICE_ANNOTATION_ITEM = {
  type: 'vo2max',
  size: 12,
  channels: 3,
  channelLabels: ['vo2max', 'cardioFitnessLevel', 'isEstimated'],
  format: 'float32',
  littleEndian: true,
  note: 'vo2max in ml/kg/min; cardioFitnessLevel 1=poor, 2=fair, 3=average, 4=good, 5=very good, 6=excellent; isEstimated 0/1; -1 means not provided',
};

export const GOOGLE_HEALTH_VO2MAX_ANNOTATION: DEVICE_ANNOTATION = [
  GOOGLE_HEALTH_ANNOTATION_ITEM_VO2MAX,
  DATA_SOURCE,
];
// #endregion

export const GOOGLE_HEALTH_SIGNAL_TYPE_ANNOTATIONS: {
  [key in DEVICE_SIGNAL_TYPE]?: DEVICE_ANNOTATION;
} = {
  calories: GOOGLE_HEALTH_CALORIES_ANNOTATION,
  steps: GOOGLE_HEALTH_STEPS_ANNOTATION,
  heartRate: GOOGLE_HEALTH_HEART_RATE_ANNOTATION,
  hrv: GOOGLE_HEALTH_HEART_RATE_VARIABILITY_ANNOTATION,
  respiratoryRate: GOOGLE_HEALTH_BREATHING_RATE_ANNOTATION,
  skinTemperature: GOOGLE_HEALTH_SKIN_TEMPERATURE_ANNOTATION,
  sleep: GOOGLE_HEALTH_SLEEP_ANNOTATION,
  spo2: GOOGLE_HEALTH_SPO2_ANNOTATION,
  restingHeartRate: GOOGLE_HEALTH_RESTING_HEART_RATE_ANNOTATION,
  distance: GOOGLE_HEALTH_DISTANCE_ANNOTATION,
  floors: GOOGLE_HEALTH_FLOORS_ANNOTATION,
  elevationGain: GOOGLE_HEALTH_ELEVATION_GAIN_ANNOTATION,
  activeZoneMinutes: GOOGLE_HEALTH_ACTIVE_ZONE_MINUTES_ANNOTATION,
  activity: GOOGLE_HEALTH_ACTIVITY_ANNOTATION,
  vo2max: GOOGLE_HEALTH_VO2MAX_ANNOTATION,
};
