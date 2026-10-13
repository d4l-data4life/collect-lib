import { ProgramDevicesDataType } from '../../types';
import { DEVICE_SIGNAL_TYPE } from '../types';
import { DEVICE_ANNOTATION_ITEM_DATA_SOURCE } from './base';
import { DEVICE_ANNOTATION, DEVICE_ANNOTATION_ITEM } from './types';

// #region Steps
export const HEALTH_CONNECT_ANNOTATION_ITEM_STEPS: DEVICE_ANNOTATION_ITEM = {
  type: 'steps',
  size: 4,
  format: 'signedInt',
  littleEndian: true,
};

export const HEALTH_CONNECT_STEPS_ANNOTATION: DEVICE_ANNOTATION = [
  HEALTH_CONNECT_ANNOTATION_ITEM_STEPS,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];
// #endregion

// #region Sleep

export type HealthConnectSleepStages =
  | 'unknown'
  | 'awake'
  | 'sleeping'
  | 'awakeOutOfBed'
  | 'sleepingLight'
  | 'sleepingDeep'
  | 'sleepingRem'
  | 'awakeInBed';

export const HEALTH_CONNECT_SLEEP_STAGE_MAP: { [key in HealthConnectSleepStages]: number } = {
  unknown: 0,
  awake: 1,
  sleeping: 2,
  awakeOutOfBed: 3,
  sleepingLight: 4,
  sleepingDeep: 5,
  sleepingRem: 6,
  awakeInBed: 7,
};

export const HEALTH_CONNECT_ANNOTATION_ITEM_SLEEP_STAGE: DEVICE_ANNOTATION_ITEM = {
  type: 'sleepStage',
  size: 1,
  format: 'unsignedInt',
  littleEndian: true,
};

export const HEALTH_CONNECT_ANNOTATION_ITEM_SLEEP_DURATION: DEVICE_ANNOTATION_ITEM = {
  type: 'duration',
  size: 2,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 's',
};

export const HEALTH_CONNECT_SLEEP_ANNOTATION: DEVICE_ANNOTATION = [
  HEALTH_CONNECT_ANNOTATION_ITEM_SLEEP_STAGE,
  HEALTH_CONNECT_ANNOTATION_ITEM_SLEEP_DURATION,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];
// #endregion

// #region SpO2 (Oxygen Saturation)
export const HEALTH_CONNECT_ITEM_SPO2: DEVICE_ANNOTATION_ITEM = {
  type: 'spo2',
  size: 4,
  format: 'float32',
  littleEndian: true,
  unit: '%',
};

export const HEALTH_CONNECT_SPO2_ANNOTATION: DEVICE_ANNOTATION = [
  HEALTH_CONNECT_ITEM_SPO2,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];
// #endregion

// #region Exercise
export const HEALTH_CONNECT_ANNOTATION_ITEM_EXERCISE_DURATION: DEVICE_ANNOTATION_ITEM = {
  type: 'duration',
  size: 4,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 's',
};

export const HEALTH_CONNECT_ANNOTATION_ITEM_EXERCISE_TYPE: DEVICE_ANNOTATION_ITEM = {
  type: 'exerciseType',
  size: 2,
  format: 'unsignedInt',
  littleEndian: true,
  note: 'Health Connect ExerciseSessionRecord.EXERCISE_TYPE_* constant',
};

export const HEALTH_CONNECT_EXERCISE_SESSION_ANNOTATION: DEVICE_ANNOTATION = [
  HEALTH_CONNECT_ANNOTATION_ITEM_EXERCISE_TYPE,
  HEALTH_CONNECT_ANNOTATION_ITEM_EXERCISE_DURATION,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];

export const HEALTH_CONNECT_ANNOTATION_ITEM_CALORIES: DEVICE_ANNOTATION_ITEM = {
  type: 'calories',
  size: 4,
  format: 'float32',
  littleEndian: true,
  unit: 'kcal',
};

export const HEALTH_CONNECT_EXERCISE_CALORIES_ANNOTATION: DEVICE_ANNOTATION = [
  HEALTH_CONNECT_ANNOTATION_ITEM_CALORIES,
  HEALTH_CONNECT_ANNOTATION_ITEM_EXERCISE_DURATION,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];

export const HEALTH_CONNECT_ANNOTATION_ITEM_DISTANCE: DEVICE_ANNOTATION_ITEM = {
  type: 'distance',
  size: 4,
  format: 'float32',
  littleEndian: true,
  unit: 'm',
};

export const HEALTH_CONNECT_EXERCISE_DISTANCE_ANNOTATION: DEVICE_ANNOTATION = [
  HEALTH_CONNECT_ANNOTATION_ITEM_DISTANCE,
  HEALTH_CONNECT_ANNOTATION_ITEM_EXERCISE_DURATION,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];

export const HEALTH_CONNECT_ANNOTATION_ITEM_HEART_RATE: DEVICE_ANNOTATION_ITEM = {
  type: 'heartRate',
  size: 2,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'bpm',
};

export const HEALTH_CONNECT_EXERCISE_HEART_RATE_ANNOTATION: DEVICE_ANNOTATION = [
  HEALTH_CONNECT_ANNOTATION_ITEM_HEART_RATE,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];

export const HEALTH_CONNECT_ANNOTATION_ITEM_POWER: DEVICE_ANNOTATION_ITEM = {
  type: 'power',
  size: 4,
  format: 'float32',
  littleEndian: true,
  unit: 'W',
};

export const HEALTH_CONNECT_EXERCISE_POWER_ANNOTATION: DEVICE_ANNOTATION = [
  HEALTH_CONNECT_ANNOTATION_ITEM_POWER,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];

export const HEALTH_CONNECT_ANNOTATION_ITEM_SPEED: DEVICE_ANNOTATION_ITEM = {
  type: 'speed',
  size: 4,
  format: 'float32',
  littleEndian: true,
  unit: 'm/s',
};

export const HEALTH_CONNECT_EXERCISE_SPEED_ANNOTATION: DEVICE_ANNOTATION = [
  HEALTH_CONNECT_ANNOTATION_ITEM_SPEED,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];

export const HEALTH_CONNECT_ANNOTATION_ITEM_VO2MAX: DEVICE_ANNOTATION_ITEM = {
  type: 'vo2max',
  size: 4,
  format: 'float32',
  littleEndian: true,
  unit: 'ml/min/kg',
};

export const HEALTH_CONNECT_ANNOTATION_ITEM_VO2MAX_MEASUREMENT_METHOD: DEVICE_ANNOTATION_ITEM = {
  type: 'vo2maxMeasurementMethod',
  size: 1,
  format: 'unsignedInt',
  littleEndian: true,
  note: 'Health Connect Vo2MaxRecord.MEASUREMENT_METHOD_* constant',
};

export const HEALTH_CONNECT_EXERCISE_VO2MAX_ANNOTATION: DEVICE_ANNOTATION = [
  HEALTH_CONNECT_ANNOTATION_ITEM_VO2MAX,
  HEALTH_CONNECT_ANNOTATION_ITEM_VO2MAX_MEASUREMENT_METHOD,
  DEVICE_ANNOTATION_ITEM_DATA_SOURCE,
];
// #endregion

// #region Signal Type Annotations
export const HEALTH_CONNECT_SIGNAL_TYPE_ANNOTATIONS: {
  [key in DEVICE_SIGNAL_TYPE]?: DEVICE_ANNOTATION;
} = {
  steps: HEALTH_CONNECT_STEPS_ANNOTATION,
  sleep: HEALTH_CONNECT_SLEEP_ANNOTATION,
  spo2: HEALTH_CONNECT_SPO2_ANNOTATION,
  exerciseSession: HEALTH_CONNECT_EXERCISE_SESSION_ANNOTATION,
  exerciseCalories: HEALTH_CONNECT_EXERCISE_CALORIES_ANNOTATION,
  exerciseDistance: HEALTH_CONNECT_EXERCISE_DISTANCE_ANNOTATION,
  exerciseHeartRate: HEALTH_CONNECT_EXERCISE_HEART_RATE_ANNOTATION,
  exercisePower: HEALTH_CONNECT_EXERCISE_POWER_ANNOTATION,
  exerciseSpeed: HEALTH_CONNECT_EXERCISE_SPEED_ANNOTATION,
  exerciseVo2max: HEALTH_CONNECT_EXERCISE_VO2MAX_ANNOTATION,
};
// #endregion

// #region Exercise Data Type
export const HEALTH_CONNECT_EXERCISE_SIGNAL_TYPES = [
  'exerciseSession',
  'exerciseCalories',
  'exerciseDistance',
  'exerciseHeartRate',
  'exercisePower',
  'exerciseSpeed',
  'exerciseVo2max',
] as const;

export const toHealthConnectSignalTypes = (
  dataTypes: ProgramDevicesDataType[]
): DEVICE_SIGNAL_TYPE[] =>
  dataTypes.flatMap((dataType): DEVICE_SIGNAL_TYPE[] =>
    dataType === 'exercise'
      ? [...HEALTH_CONNECT_EXERCISE_SIGNAL_TYPES]
      : [dataType as DEVICE_SIGNAL_TYPE]
  );
// #endregion
