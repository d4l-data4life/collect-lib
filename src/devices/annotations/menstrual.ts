import { DEVICE_ANNOTATION, DEVICE_ANNOTATION_ITEM } from './types';

// Platform-neutral menstrual-health encodings. Vendors expose two distinct data
// species, so there are two annotation types:
//
// - `menstrualCycle`: a computed per-day cycle-state snapshot. Garmin MCT delivers
//   this today; Oura's announced cycle-phase data fits the same shape (fill absent
//   channels with -1).
// - `menstrualFlow`: user-logged per-day observations. Apple HealthKit
//   (HKCategoryTypeIdentifierMenstrualFlow) and Health Connect
//   (MenstruationFlowRecord / MenstruationPeriodRecord) deliver these.
//
// Mappers translate vendor codes to the canonical enums below (same pattern as the
// shared sleep-level codes); never store vendor enums verbatim.

/** Canonical cycle phase. Garmin `currentPhaseType` / Oura phases map onto this. */
export const MENSTRUAL_CYCLE_PHASE = {
  unknown: -1,
  menstrual: 1,
  follicular: 2,
  ovulation: 3,
  luteal: 4,
  pregnancy: 5,
} as const;

/** Canonical flow strength. Apple/Health Connect flow values map onto this. */
export const MENSTRUAL_FLOW = {
  unknown: -1,
  none: 0,
  unspecified: 1,
  spotting: 2,
  light: 3,
  medium: 4,
  heavy: 5,
} as const;

// One snapshot per calendar day describing the cycle state on that day. All
// channels are signed 16-bit; -1 means the field was not provided. `phase` uses
// MENSTRUAL_CYCLE_PHASE; day/window channels are day-in-cycle indices; lengths are
// in days. Pregnancy details beyond the phase are not encoded (no fixed-width
// representation).
export const MENSTRUAL_CYCLE_ANNOTATION_ITEM: DEVICE_ANNOTATION_ITEM = {
  type: 'menstrualCycle',
  size: 14,
  channels: 7,
  channelLabels: [
    'dayInCycle',
    'phase',
    'cycleLength',
    'periodLength',
    'daysUntilNextPhase',
    'fertileWindowStart',
    'isPredictedCycle',
  ],
  format: 'signedInt',
  littleEndian: true,
  note: '-1 means not provided; phase per MENSTRUAL_CYCLE_PHASE',
};

export const MENSTRUAL_CYCLE_ANNOTATION: DEVICE_ANNOTATION = [MENSTRUAL_CYCLE_ANNOTATION_ITEM];

// One user-logged observation per day. `flow` uses MENSTRUAL_FLOW; `isCycleStart`
// is 1 on the first day of a period (Apple's HKMetadataKeyMenstrualCycleStart,
// Health Connect's MenstruationPeriodRecord start), 0 otherwise, -1 unknown.
export const MENSTRUAL_FLOW_ANNOTATION_ITEM: DEVICE_ANNOTATION_ITEM = {
  type: 'menstrualFlow',
  size: 4,
  channels: 2,
  channelLabels: ['flow', 'isCycleStart'],
  format: 'signedInt',
  littleEndian: true,
  note: '-1 means not provided; flow per MENSTRUAL_FLOW',
};

export const MENSTRUAL_FLOW_ANNOTATION: DEVICE_ANNOTATION = [MENSTRUAL_FLOW_ANNOTATION_ITEM];
