import { APPLE_HEALTH_SLEEP_STATE_MAP, AppleHealthSleepStates } from './appleHealth';
import { FITBIT_SLEEP_LEVEL_MAP, FitbitSleepLevelTypes } from './fitbit';
import { HEALTH_CONNECT_SLEEP_STAGE_MAP, HealthConnectSleepStages } from './healthConnect';
import { MENSTRUAL_CYCLE_PHASE, MENSTRUAL_FLOW } from './menstrual';

// Mirrored by hand in data-receiver pkg/models/categorical_labels.go keep in sync when either changes.

function invertLabelMap<Label extends string>(map: Record<Label, number>): Record<number, Label> {
  const inverted = {} as Record<number, Label>;
  (Object.keys(map) as Label[]).forEach((label) => {
    inverted[map[label]] = label;
  });
  return inverted;
}

// source: src/devices/annotations/fitbit.ts:100 (FITBIT_SLEEP_LEVEL_MAP)
export const SLEEP_LEVEL_LABELS: Record<number, FitbitSleepLevelTypes> =
  invertLabelMap(FITBIT_SLEEP_LEVEL_MAP);

// source: src/devices/annotations/appleHealth.ts:61 (APPLE_HEALTH_SLEEP_STATE_MAP)
export const APPLE_HEALTH_SLEEP_STATE_LABELS: Record<number, AppleHealthSleepStates> = invertLabelMap(
  APPLE_HEALTH_SLEEP_STATE_MAP
);

// source: src/devices/annotations/healthConnect.ts:21 (HEALTH_CONNECT_SLEEP_STAGE_MAP)
export const HEALTH_CONNECT_SLEEP_STAGE_LABELS: Record<number, HealthConnectSleepStages> = invertLabelMap(
  HEALTH_CONNECT_SLEEP_STAGE_MAP
);

// source: https://developer.android.com/reference/kotlin/androidx/health/services/client/data/UserActivityState
export type ActivityDetectionTypes = 'unknown' | 'exercise' | 'passive' | 'asleep';

export const ACTIVITY_DETECTION_LABELS: Record<number, ActivityDetectionTypes> = {
  0: 'unknown',
  1: 'exercise',
  2: 'passive',
  3: 'asleep',
};

// source: menstrual.ts:17 (MENSTRUAL_CYCLE_PHASE)
export const MENSTRUAL_CYCLE_PHASE_LABELS: Record<number, keyof typeof MENSTRUAL_CYCLE_PHASE> =
  invertLabelMap(MENSTRUAL_CYCLE_PHASE);

// source: menstrual.ts:27 (MENSTRUAL_FLOW)
export const MENSTRUAL_FLOW_LABELS: Record<number, keyof typeof MENSTRUAL_FLOW> =
  invertLabelMap(MENSTRUAL_FLOW);

// source: oura.ts:77 (note field)
export type OuraActivityLevelTypes = 'non_wear' | 'rest' | 'inactive' | 'low' | 'medium' | 'high';

export const OURA_ACTIVITY_LEVEL_LABELS: Record<number, OuraActivityLevelTypes> = {
  0: 'non_wear',
  1: 'rest',
  2: 'inactive',
  3: 'low',
  4: 'medium',
  5: 'high',
};

// source: garmin.ts:102
export type GarminActivityLevelTypes = 'sedentary' | 'active' | 'highly_active';

export const GARMIN_ACTIVITY_LEVEL_LABELS: Record<number, GarminActivityLevelTypes> = {
  0: 'sedentary',
  1: 'active',
  2: 'highly_active',
};

// source: phoenix/node_modules/@kingstinct/react-native-healthkit@14.0.2/lib/typescript/generated/
// healthkit.generated.d.ts, `enum CategoryValueMenstrualFlow`
export type AppleHealthMenstrualStateTypes = 'unspecified' | 'light' | 'medium' | 'heavy' | 'none';

export const APPLE_HEALTH_MENSTRUAL_STATE_LABELS: Record<number, AppleHealthMenstrualStateTypes> = {
  1: 'unspecified',
  2: 'light',
  3: 'medium',
  4: 'heavy',
  5: 'none',
};

// source: appleHealth.ts:232
export type AppleHealthMoveModeTypes = 'activeEnergy' | 'appleMoveTime';

export const APPLE_HEALTH_MOVE_MODE_LABELS: Record<number, AppleHealthMoveModeTypes> = {
  1: 'activeEnergy',
  2: 'appleMoveTime',
};

// source: phoenix/node_modules/@kingstinct/react-native-healthkit@14.0.2/lib/typescript/generated/
// healthkit.generated.d.ts, `enum CategoryValueContraceptive`
export type AppleHealthContraceptiveTypes =
  | 'unspecified'
  | 'implant'
  | 'injection'
  | 'intrauterineDevice'
  | 'intravaginalRing'
  | 'oral'
  | 'patch';

export const APPLE_HEALTH_CONTRACEPTIVE_TYPE_LABELS: Record<number, AppleHealthContraceptiveTypes> = {
  1: 'unspecified',
  2: 'implant',
  3: 'injection',
  4: 'intrauterineDevice',
  5: 'intravaginalRing',
  6: 'oral',
  7: 'patch',
};

// source: phoenix/node_modules/@kingstinct/react-native-healthkit@14.0.2/lib/typescript/generated/
// healthkit.generated.d.ts, `enum WorkoutActivityType`
export type AppleHealthWorkoutActivityTypes =
  | 'americanFootball'
  | 'archery'
  | 'australianFootball'
  | 'badminton'
  | 'baseball'
  | 'basketball'
  | 'bowling'
  | 'boxing'
  | 'climbing'
  | 'cricket'
  | 'crossTraining'
  | 'curling'
  | 'cycling'
  | 'dance'
  | 'danceInspiredTraining'
  | 'elliptical'
  | 'equestrianSports'
  | 'fencing'
  | 'fishing'
  | 'functionalStrengthTraining'
  | 'golf'
  | 'gymnastics'
  | 'handball'
  | 'hiking'
  | 'hockey'
  | 'hunting'
  | 'lacrosse'
  | 'martialArts'
  | 'mindAndBody'
  | 'mixedMetabolicCardioTraining'
  | 'paddleSports'
  | 'play'
  | 'preparationAndRecovery'
  | 'racquetball'
  | 'rowing'
  | 'rugby'
  | 'running'
  | 'sailing'
  | 'skatingSports'
  | 'snowSports'
  | 'soccer'
  | 'softball'
  | 'squash'
  | 'stairClimbing'
  | 'surfingSports'
  | 'swimming'
  | 'tableTennis'
  | 'tennis'
  | 'trackAndField'
  | 'traditionalStrengthTraining'
  | 'volleyball'
  | 'walking'
  | 'waterFitness'
  | 'waterPolo'
  | 'waterSports'
  | 'wrestling'
  | 'yoga'
  | 'barre'
  | 'coreTraining'
  | 'crossCountrySkiing'
  | 'downhillSkiing'
  | 'flexibility'
  | 'highIntensityIntervalTraining'
  | 'jumpRope'
  | 'kickboxing'
  | 'pilates'
  | 'snowboarding'
  | 'stairs'
  | 'stepTraining'
  | 'wheelchairWalkPace'
  | 'wheelchairRunPace'
  | 'taiChi'
  | 'mixedCardio'
  | 'handCycling'
  | 'discSports'
  | 'fitnessGaming'
  | 'cardioDance'
  | 'socialDance'
  | 'pickleball'
  | 'cooldown'
  | 'swimBikeRun'
  | 'transition'
  | 'underwaterDiving'
  | 'other';

export const APPLE_HEALTH_WORKOUT_ACTIVITY_TYPE_LABELS: Record<number, AppleHealthWorkoutActivityTypes> = {
  1: 'americanFootball',
  2: 'archery',
  3: 'australianFootball',
  4: 'badminton',
  5: 'baseball',
  6: 'basketball',
  7: 'bowling',
  8: 'boxing',
  9: 'climbing',
  10: 'cricket',
  11: 'crossTraining',
  12: 'curling',
  13: 'cycling',
  14: 'dance',
  15: 'danceInspiredTraining',
  16: 'elliptical',
  17: 'equestrianSports',
  18: 'fencing',
  19: 'fishing',
  20: 'functionalStrengthTraining',
  21: 'golf',
  22: 'gymnastics',
  23: 'handball',
  24: 'hiking',
  25: 'hockey',
  26: 'hunting',
  27: 'lacrosse',
  28: 'martialArts',
  29: 'mindAndBody',
  30: 'mixedMetabolicCardioTraining',
  31: 'paddleSports',
  32: 'play',
  33: 'preparationAndRecovery',
  34: 'racquetball',
  35: 'rowing',
  36: 'rugby',
  37: 'running',
  38: 'sailing',
  39: 'skatingSports',
  40: 'snowSports',
  41: 'soccer',
  42: 'softball',
  43: 'squash',
  44: 'stairClimbing',
  45: 'surfingSports',
  46: 'swimming',
  47: 'tableTennis',
  48: 'tennis',
  49: 'trackAndField',
  50: 'traditionalStrengthTraining',
  51: 'volleyball',
  52: 'walking',
  53: 'waterFitness',
  54: 'waterPolo',
  55: 'waterSports',
  56: 'wrestling',
  57: 'yoga',
  58: 'barre',
  59: 'coreTraining',
  60: 'crossCountrySkiing',
  61: 'downhillSkiing',
  62: 'flexibility',
  63: 'highIntensityIntervalTraining',
  64: 'jumpRope',
  65: 'kickboxing',
  66: 'pilates',
  67: 'snowboarding',
  68: 'stairs',
  69: 'stepTraining',
  70: 'wheelchairWalkPace',
  71: 'wheelchairRunPace',
  72: 'taiChi',
  73: 'mixedCardio',
  74: 'handCycling',
  75: 'discSports',
  76: 'fitnessGaming',
  77: 'cardioDance',
  78: 'socialDance',
  79: 'pickleball',
  80: 'cooldown',
  82: 'swimBikeRun',
  83: 'transition',
  84: 'underwaterDiving',
  3000: 'other',
};
