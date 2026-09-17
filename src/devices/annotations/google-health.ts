import { DEVICE_SIGNAL_TYPE } from '../types';
import { DEVICE_ANNOTATION_ITEM_RESTING_HEART_RATE } from './base';
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
import { MENSTRUAL_FLOW_ANNOTATION } from './menstrual';
import { DEVICE_ANNOTATION, DEVICE_ANNOTATION_ITEM } from './types';
import {
  BLE_CPMS_ANNOTATION_ITEM_DAILY_DISTANCE,
  BLE_CPMS_ANNOTATION_ITEM_DAILY_ELEVATION_GAIN,
  BLE_CPMS_ANNOTATION_ITEM_DAILY_FLOORS,
} from './wearOS3';

// #region Active Zone Minutes (active-zone-minutes)
// One item per Google interval, anchored at the interval start. Minutes are earned per
// heart-rate zone (fat burn counts 1×, cardio and peak 2× — Fitbit's AZM rule), so one
// window can arrive as several items sharing a timestamp, one per zone.
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
];
// #endregion

// #region Activity level (activity-level)
// One item per Google interval, anchored at the interval start, with the interval length
// as duration. The level uses Google's own 4-step scale — deliberately not Oura's 0-5 or
// Garmin's 0-2; each device documents its own.
export const GOOGLE_HEALTH_ANNOTATION_ITEM_ACTIVITY_LEVEL: DEVICE_ANNOTATION_ITEM = {
  type: 'activityLevel',
  size: 1,
  format: 'unsignedInt',
  note: '0=sedentary, 1=lightly active, 2=moderately active, 3=very active (Google Health activity level)',
};

export const GOOGLE_HEALTH_ANNOTATION_ITEM_ACTIVITY_DURATION: DEVICE_ANNOTATION_ITEM = {
  type: 'duration',
  size: 4,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 's',
  note: 'length of the observed interval',
};

export const GOOGLE_HEALTH_ACTIVITY_ANNOTATION: DEVICE_ANNOTATION = [
  GOOGLE_HEALTH_ANNOTATION_ITEM_ACTIVITY_LEVEL,
  GOOGLE_HEALTH_ANNOTATION_ITEM_ACTIVITY_DURATION,
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
];
// #endregion

// The Fitbit-era signals are aliased to Fitbit: Google Health emits the same physical
// quantities and we store them with the same on-device buffer encoding so a study can
// ingest both sources through the same FHIR pipeline. Fork only if a signal's data shape
// diverges from Fitbit's. Later additions re-use the shared encodings (Wear OS daily
// counters, the provider-neutral resting heart rate and menstrual flow) and get
// Google-specific ones only where no shared shape fits.
export const GOOGLE_HEALTH_SIGNAL_TYPE_ANNOTATIONS: {
  [key in DEVICE_SIGNAL_TYPE]?: DEVICE_ANNOTATION;
} = {
  calories: FITBIT_CALORIES_ANNOTATION,
  steps: FITBIT_STEPS_ANNOTATION,
  heartRate: FITBIT_HEART_RATE_ANNOTATION,
  hrv: FITBIT_HEART_RATE_VARIABILITY_ANNOTATION,
  respiratoryRate: FITBIT_BREATHING_RATE_ANNOTATION,
  skinTemperature: FITBIT_SKIN_TEMPERATURE_ANNOTATION,
  sleep: FITBIT_SLEEP_ANNOTATION,
  spo2: FITBIT_SPO2_ANNOTATION,
  restingHeartRate: [DEVICE_ANNOTATION_ITEM_RESTING_HEART_RATE],
  // Running day totals in metres / floors (same float32 encoding and `last value = day
  // total` semantics as the Wear OS daily counters and Garmin's dailies). Google delivers
  // per-interval increments; the Phoenix mapper accumulates them per local day.
  dailyDistance: [BLE_CPMS_ANNOTATION_ITEM_DAILY_DISTANCE],
  dailyFloors: [BLE_CPMS_ANNOTATION_ITEM_DAILY_FLOORS],
  dailyElevationGain: [BLE_CPMS_ANNOTATION_ITEM_DAILY_ELEVATION_GAIN],
  activeZoneMinutes: GOOGLE_HEALTH_ACTIVE_ZONE_MINUTES_ANNOTATION,
  activity: GOOGLE_HEALTH_ACTIVITY_ANNOTATION,
  vo2max: GOOGLE_HEALTH_VO2MAX_ANNOTATION,
  // menstrual-period is a logged period interval (the shape of Health Connect's
  // MenstruationPeriodRecord), i.e. the per-day flow observation — not the computed cycle
  // snapshot Garmin delivers. Google carries no flow strength, so the mapper records
  // MENSTRUAL_FLOW.unspecified.
  menstrualCycle: MENSTRUAL_FLOW_ANNOTATION,
};
