import { APPLE_HEALTH_SLEEP_STATE_MAP, AppleHealthSleepStates } from './appleHealth';
import { FITBIT_SLEEP_LEVEL_MAP, FitbitSleepLevelTypes } from './fitbit';
import {
  GOOGLE_HEALTH_ACTIVITY_LEVEL_MAP,
  GOOGLE_HEALTH_CARDIO_FITNESS_LEVEL_MAP,
  GOOGLE_HEALTH_HEART_RATE_ZONE_MAP,
  GoogleHealthActivityLevelType,
  GoogleHealthCardioFitnessLevel,
  GoogleHealthHeartRateZone,
} from './google-health';
import { HEALTH_CONNECT_SLEEP_STAGE_MAP, HealthConnectSleepStages } from './healthConnect';
import { MENSTRUAL_CYCLE_PHASE, MENSTRUAL_FLOW } from './menstrual';
import { DEVICE_KEY_TO_NAME } from '../types';

// CATEGORICAL_LABELS (bottom of this file) is exported to Go as pkg/categoricallabels (see
// README_GO.md), which data-receiver uses to write labels instead of codes into its CSV export.

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

// source: google-health.ts (GOOGLE_HEALTH_HEART_RATE_ZONE_MAP)
export const GOOGLE_HEALTH_HEART_RATE_ZONE_LABELS: Record<number, GoogleHealthHeartRateZone> = invertLabelMap(
  GOOGLE_HEALTH_HEART_RATE_ZONE_MAP
);

// source: google-health.ts (GOOGLE_HEALTH_ACTIVITY_LEVEL_MAP)
export const GOOGLE_HEALTH_ACTIVITY_LEVEL_LABELS: Record<number, GoogleHealthActivityLevelType> =
  invertLabelMap(GOOGLE_HEALTH_ACTIVITY_LEVEL_MAP);

// source: google-health.ts (GOOGLE_HEALTH_CARDIO_FITNESS_LEVEL_MAP); -1 ("not provided") has no label
export const GOOGLE_HEALTH_CARDIO_FITNESS_LEVEL_LABELS: Record<number, GoogleHealthCardioFitnessLevel> =
  invertLabelMap(GOOGLE_HEALTH_CARDIO_FITNESS_LEVEL_MAP);

// source: phoenix/node_modules/react-native-health-connect@3.5.0/src/constants.ts, `Vo2MaxMeasurementMethod`
export type HealthConnectVo2MaxMeasurementMethodTypes =
  | 'other'
  | 'metabolicCart'
  | 'heartRateRatio'
  | 'cooperTest'
  | 'multistageFitnessTest'
  | 'rockportFitnessTest';

export const HEALTH_CONNECT_VO2MAX_MEASUREMENT_METHOD_LABELS: Record<
  number,
  HealthConnectVo2MaxMeasurementMethodTypes
> = {
  0: 'other',
  1: 'metabolicCart',
  2: 'heartRateRatio',
  3: 'cooperTest',
  4: 'multistageFitnessTest',
  5: 'rockportFitnessTest',
};

// source: phoenix/node_modules/react-native-health-connect@3.5.0/src/constants.ts, `ExerciseType`
// (Android ExerciseSessionRecord.EXERCISE_TYPE_*; 45 is not assigned)
export type HealthConnectExerciseTypes =
  | 'otherWorkout'
  | 'backExtension'
  | 'badminton'
  | 'barbellShoulderPress'
  | 'baseball'
  | 'basketball'
  | 'benchPress'
  | 'benchSitUp'
  | 'biking'
  | 'bikingStationary'
  | 'bootCamp'
  | 'boxing'
  | 'burpee'
  | 'calisthenics'
  | 'cricket'
  | 'crunch'
  | 'dancing'
  | 'deadlift'
  | 'dumbbellCurlLeftArm'
  | 'dumbbellCurlRightArm'
  | 'dumbbellFrontRaise'
  | 'dumbbellLateralRaise'
  | 'dumbbellTricepsExtensionLeftArm'
  | 'dumbbellTricepsExtensionRightArm'
  | 'dumbbellTricepsExtensionTwoArm'
  | 'elliptical'
  | 'exerciseClass'
  | 'fencing'
  | 'footballAmerican'
  | 'footballAustralian'
  | 'forwardTwist'
  | 'frisbeeDisc'
  | 'golf'
  | 'guidedBreathing'
  | 'gymnastics'
  | 'handball'
  | 'highIntensityIntervalTraining'
  | 'hiking'
  | 'iceHockey'
  | 'iceSkating'
  | 'jumpingJack'
  | 'jumpRope'
  | 'latPullDown'
  | 'lunge'
  | 'martialArts'
  | 'paddling'
  | 'paragliding'
  | 'pilates'
  | 'plank'
  | 'racquetball'
  | 'rockClimbing'
  | 'rollerHockey'
  | 'rowing'
  | 'rowingMachine'
  | 'rugby'
  | 'running'
  | 'runningTreadmill'
  | 'sailing'
  | 'scubaDiving'
  | 'skating'
  | 'skiing'
  | 'snowboarding'
  | 'snowshoeing'
  | 'soccer'
  | 'softball'
  | 'squash'
  | 'squat'
  | 'stairClimbing'
  | 'stairClimbingMachine'
  | 'strengthTraining'
  | 'stretching'
  | 'surfing'
  | 'swimmingOpenWater'
  | 'swimmingPool'
  | 'tableTennis'
  | 'tennis'
  | 'upperTwist'
  | 'volleyball'
  | 'walking'
  | 'waterPolo'
  | 'weightlifting'
  | 'wheelchair'
  | 'yoga';

export const HEALTH_CONNECT_EXERCISE_TYPE_LABELS: Record<number, HealthConnectExerciseTypes> = {
  0: 'otherWorkout',
  1: 'backExtension',
  2: 'badminton',
  3: 'barbellShoulderPress',
  4: 'baseball',
  5: 'basketball',
  6: 'benchPress',
  7: 'benchSitUp',
  8: 'biking',
  9: 'bikingStationary',
  10: 'bootCamp',
  11: 'boxing',
  12: 'burpee',
  13: 'calisthenics',
  14: 'cricket',
  15: 'crunch',
  16: 'dancing',
  17: 'deadlift',
  18: 'dumbbellCurlLeftArm',
  19: 'dumbbellCurlRightArm',
  20: 'dumbbellFrontRaise',
  21: 'dumbbellLateralRaise',
  22: 'dumbbellTricepsExtensionLeftArm',
  23: 'dumbbellTricepsExtensionRightArm',
  24: 'dumbbellTricepsExtensionTwoArm',
  25: 'elliptical',
  26: 'exerciseClass',
  27: 'fencing',
  28: 'footballAmerican',
  29: 'footballAustralian',
  30: 'forwardTwist',
  31: 'frisbeeDisc',
  32: 'golf',
  33: 'guidedBreathing',
  34: 'gymnastics',
  35: 'handball',
  36: 'highIntensityIntervalTraining',
  37: 'hiking',
  38: 'iceHockey',
  39: 'iceSkating',
  40: 'jumpingJack',
  41: 'jumpRope',
  42: 'latPullDown',
  43: 'lunge',
  44: 'martialArts',
  46: 'paddling',
  47: 'paragliding',
  48: 'pilates',
  49: 'plank',
  50: 'racquetball',
  51: 'rockClimbing',
  52: 'rollerHockey',
  53: 'rowing',
  54: 'rowingMachine',
  55: 'rugby',
  56: 'running',
  57: 'runningTreadmill',
  58: 'sailing',
  59: 'scubaDiving',
  60: 'skating',
  61: 'skiing',
  62: 'snowboarding',
  63: 'snowshoeing',
  64: 'soccer',
  65: 'softball',
  66: 'squash',
  67: 'squat',
  68: 'stairClimbing',
  69: 'stairClimbingMachine',
  70: 'strengthTraining',
  71: 'stretching',
  72: 'surfing',
  73: 'swimmingOpenWater',
  74: 'swimmingPool',
  75: 'tableTennis',
  76: 'tennis',
  77: 'upperTwist',
  78: 'volleyball',
  79: 'walking',
  80: 'waterPolo',
  81: 'weightlifting',
  82: 'wheelchair',
  83: 'yoga',
};

// #region Registry
// Which label table applies to which value: device full name (as sent in the recording's
// Device resource) → annotation item type → column (the item type, or the channel label of a
// multi-channel item) → code → label. Device-specific entries win over ANY_DEVICE.
export const ANY_DEVICE = '';

export type CategoricalLabelRegistry = {
  [deviceName: string]: {
    [annotationType: string]: { [column: string]: Record<number, string> };
  };
};

export const CATEGORICAL_LABELS: CategoricalLabelRegistry = {
  [ANY_DEVICE]: {
    sleepLevel: { sleepLevel: SLEEP_LEVEL_LABELS },
    activityDetection: { activityDetection: ACTIVITY_DETECTION_LABELS },
  },
  [DEVICE_KEY_TO_NAME.OURA.fullName]: {
    activityLevel: { activityLevel: OURA_ACTIVITY_LEVEL_LABELS },
  },
  [DEVICE_KEY_TO_NAME.GARMIN.fullName]: {
    activityLevel: { activityLevel: GARMIN_ACTIVITY_LEVEL_LABELS },
    menstrualCycle: { phase: MENSTRUAL_CYCLE_PHASE_LABELS },
  },
  [DEVICE_KEY_TO_NAME.AppleHealth.fullName]: {
    sleepState: { sleepState: APPLE_HEALTH_SLEEP_STATE_LABELS },
    menstrualCycle: { state: APPLE_HEALTH_MENSTRUAL_STATE_LABELS },
    activitySummary: { moveMode: APPLE_HEALTH_MOVE_MODE_LABELS },
    contraceptiveType: { contraceptiveType: APPLE_HEALTH_CONTRACEPTIVE_TYPE_LABELS },
    workout: { activityType: APPLE_HEALTH_WORKOUT_ACTIVITY_TYPE_LABELS },
  },
  [DEVICE_KEY_TO_NAME.GOOGLE_HEALTH.fullName]: {
    heartRateZone: { heartRateZone: GOOGLE_HEALTH_HEART_RATE_ZONE_LABELS },
    activityLevel: { activityLevel: GOOGLE_HEALTH_ACTIVITY_LEVEL_LABELS },
    vo2max: { cardioFitnessLevel: GOOGLE_HEALTH_CARDIO_FITNESS_LEVEL_LABELS },
  },
  [DEVICE_KEY_TO_NAME.HealthConnect.fullName]: {
    sleepStage: { sleepStage: HEALTH_CONNECT_SLEEP_STAGE_LABELS },
    exerciseType: { exerciseType: HEALTH_CONNECT_EXERCISE_TYPE_LABELS },
    vo2maxMeasurementMethod: { vo2maxMeasurementMethod: HEALTH_CONNECT_VO2MAX_MEASUREMENT_METHOD_LABELS },
  },
};
// #endregion

// The label for code in column of an annotationType item, sent by deviceName, or undefined if
// there is none. Device-specific tables win over ANY_DEVICE ones.
export const categoricalLabel = (
  deviceName: string,
  annotationType: string,
  column: string,
  code: number
): string | undefined =>
  CATEGORICAL_LABELS[deviceName]?.[annotationType]?.[column]?.[code] ??
  CATEGORICAL_LABELS[ANY_DEVICE]?.[annotationType]?.[column]?.[code];
