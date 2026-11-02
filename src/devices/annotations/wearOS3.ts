import { DEVICE_SIGNAL_TYPE } from '../types';
import {
  DEVICE_ANNOTATION_HEARTRATE,
  DEVICE_ANNOTATION_ITEM_ACCELERATION,
  DEVICE_ANNOTATION_ITEM_ANGULAR_SPEED,
  DEVICE_ANNOTATION_ITEM_MAGNETIC_FIELD,
} from './base';
import { DEVICE_ANNOTATION, DEVICE_ANNOTATION_ITEM } from './types';

// ====================
// #region Annotation Items
// ====================

export const DEVICE_D4L_COMPANION_ANNOTATION_ITEM_DATA_TYPES_FLAG: DEVICE_ANNOTATION_ITEM = {
  type: 'flag',
  size: 1,
  format: 'bitmask',
  note: 'Lists the exported data types as bitmask, 0b001 = acceleration, 0b010 = angular speed, 0b100 = magnetic field',
};

export const DEVICE_D4L_COMPANION_ANNOTATION_ITEM_TIMESTAMP: DEVICE_ANNOTATION_ITEM = {
  type: 'timestamp',
  size: 8,
  format: 'signedInt',
  littleEndian: true,
  unit: 'ms',
};

export const BLE_PAMS_ANNOTATION_ITEM_HEADER: DEVICE_ANNOTATION_ITEM = {
  type: 'flag',
  size: 1,
  format: 'bitmask',
  littleEndian: true,
};

export const BLE_PAMS_ANNOTATION_ITEM_FLAGS_8: DEVICE_ANNOTATION_ITEM = {
  type: 'flag',
  size: 1,
  format: 'bitmask',
  littleEndian: true,
};

export const BLE_PAMS_ANNOTATION_ITEM_FLAGS_16: DEVICE_ANNOTATION_ITEM = {
  type: 'flag',
  size: 2,
  format: 'bitmask',
  littleEndian: true,
};

export const BLE_PAMS_ANNOTATION_ITEM_FLAGS_24: DEVICE_ANNOTATION_ITEM = {
  type: 'flag',
  size: 3,
  format: 'bitmask',
  littleEndian: true,
};

export const BLE_PAMS_ANNOTATION_ITEM_FLAGS_32: DEVICE_ANNOTATION_ITEM = {
  type: 'flag',
  size: 4,
  format: 'bitmask',
  littleEndian: true,
};

export const BLE_PAMS_ANNOTATION_ITEM_BYTE: DEVICE_ANNOTATION_ITEM = {
  type: 'any',
  size: 1,
  format: 'byte',
};

export const BLE_PAMS_ANNOTATION_ITEM_TWO_BYTES: DEVICE_ANNOTATION_ITEM = {
  type: 'any',
  size: 2,
  format: 'byte',
};

export const BLE_PAMS_ANNOTATION_ITEM_THREE_BYTES: DEVICE_ANNOTATION_ITEM = {
  type: 'any',
  size: 3,
  format: 'byte',
};

export const BLE_PAMS_ANNOTATION_ITEM_FOUR_BYTES: DEVICE_ANNOTATION_ITEM = {
  type: 'any',
  size: 4,
  format: 'byte',
};

export const BLE_PAMS_ANNOTATION_ITEM_SPEED: DEVICE_ANNOTATION_ITEM = {
  type: 'speed',
  size: 2,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'km/h',
};

export const BLE_PAMS_ANNOTATION_ITEM_MOTION_CADENCE: DEVICE_ANNOTATION_ITEM = {
  type: 'motionCadence',
  size: 2,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'steps/min',
};

export const BLE_PAMS_ANNOTATION_ITEM_ABSOLUTE_ELEVATION: DEVICE_ANNOTATION_ITEM = {
  type: 'absoluteElevation',
  size: 3,
  format: 'signedInt',
  littleEndian: true,
};

export const BLE_PAMS_ANNOTATION_ITEM_CALORIES_TOTAL: DEVICE_ANNOTATION_ITEM = {
  type: 'caloriesTotal',
  size: 4,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'Calories',
};

export const BLE_PAMS_ANNOTATION_ITEM_DISTANCE_TOTAL: DEVICE_ANNOTATION_ITEM = {
  type: 'distanceTotal',
  size: 3,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'm',
};

export const BLE_PAMS_ANNOTATION_ITEM_FLOORS_TOTAL: DEVICE_ANNOTATION_ITEM = {
  type: 'floorsTotal',
  size: 1,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'Floors',
};

export const BLE_PAMS_ANNOTATION_ITEM_POSITIVE_ELEVATION_GAIN: DEVICE_ANNOTATION_ITEM = {
  type: 'positiveElevationTotal',
  size: 3,
  format: 'unsignedInt',
  littleEndian: true,
  unit: '0.01m',
};

export const BLE_PAMS_ANNOTATION_ITEM_NEGATIVE_ELEVATION_GAIN: DEVICE_ANNOTATION_ITEM = {
  type: 'negativeElevationTotal',
  size: 3,
  format: 'unsignedInt',
  littleEndian: true,
  unit: '0.01m',
};

export const BLE_PAMS_ANNOTATION_ITEM_MINIMUM_SPEED: DEVICE_ANNOTATION_ITEM = {
  type: 'minSpeed',
  size: 2,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'km/h',
};

export const BLE_PAMS_ANNOTATION_ITEM_MAXIMUM_SPEED: DEVICE_ANNOTATION_ITEM = {
  type: 'maxSpeed',
  size: 2,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'km/h',
};

export const BLE_PAMS_ANNOTATION_ITEM_AVERAGE_SPEED: DEVICE_ANNOTATION_ITEM = {
  type: 'averageSpeed',
  size: 2,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'km/h',
};

export const BLE_PAMS_ANNOTATION_ITEM_MINIMUM_MOTION_CADENCE: DEVICE_ANNOTATION_ITEM = {
  type: 'minMotionCadence',
  size: 2,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'steps/min',
};

export const BLE_PAMS_ANNOTATION_ITEM_MAXIMUM_MOTION_CADENCE: DEVICE_ANNOTATION_ITEM = {
  type: 'maxMotionCadence',
  size: 2,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'steps/min',
};

export const BLE_PAMS_ANNOTATION_ITEM_AVERAGE_MOTION_CADENCE: DEVICE_ANNOTATION_ITEM = {
  type: 'averageMotionCadence',
  size: 2,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'steps/min',
};

export const BLE_PAMS_ANNOTATION_ITEM_HEART_RATE: DEVICE_ANNOTATION_ITEM = {
  type: 'heartRate',
  size: 1,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'bpm',
};

export const BLE_PAMS_ANNOTATION_ITEM_VO2_MAX: DEVICE_ANNOTATION_ITEM = {
  type: 'vo2max',
  size: 1,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'mm/kg/min',
};
export const BLE_PAMS_ANNOTATION_ITEM_STEPS_TOTAL: DEVICE_ANNOTATION_ITEM = {
  type: 'stepsTotal',
  size: 3,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'steps',
};

export const BLE_PAMS_ANNOTATION_ITEM_RUNNING_STEPS_TOTAL: DEVICE_ANNOTATION_ITEM = {
  type: 'runningStepsTotal',
  size: 3,
  format: 'unsignedInt',
  littleEndian: true,
};

export const BLE_CPMS_ANNOTATION_ITEM_DAILY_STEPS: DEVICE_ANNOTATION_ITEM = {
  type: 'dailySteps',
  size: 4,
  format: 'signedInt',
  littleEndian: true,
};

export const BLE_CPMS_ANNOTATION_ITEM_DAILY_DISTANCE: DEVICE_ANNOTATION_ITEM = {
  type: 'dailyDistance',
  size: 4,
  format: 'float32',
  littleEndian: true,
};

export const BLE_CPMS_ANNOTATION_ITEM_DAILY_CALORIES: DEVICE_ANNOTATION_ITEM = {
  type: 'dailyCalories',
  size: 4,
  format: 'float32',
  littleEndian: true,
};

export const BLE_CPMS_ANNOTATION_ITEM_DAILY_FLOORS: DEVICE_ANNOTATION_ITEM = {
  type: 'dailyFloors',
  size: 4,
  format: 'float32',
  littleEndian: true,
};

export const BLE_CPMS_ANNOTATION_ITEM_DAILY_ELEVATION_GAIN: DEVICE_ANNOTATION_ITEM = {
  type: 'dailyElevationGain',
  size: 4,
  format: 'float32',
  littleEndian: true,
};

export const BLE_CPMS_ANNOTATION_ITEM_ACTIVITY_TYPE: DEVICE_ANNOTATION_ITEM = {
  type: 'activityDetection',
  size: 1,
  format: 'byte',
  littleEndian: true,
};

export const BLE_ASMS_ANNOTATION_ITEM_ECG: DEVICE_ANNOTATION_ITEM = {
  type: 'ecg',
  size: 4,
  format: 'float32',
  littleEndian: true,
};

export const BLE_ASMS_ANNOTATION_ITEM_SPO2: DEVICE_ANNOTATION_ITEM = {
  type: 'spo2',
  size: 4,
  format: 'signedInt',
  littleEndian: true,
};

export const BLE_PSMS_ANNOTATION_ITEM_HEART_RATE: DEVICE_ANNOTATION_ITEM = {
  type: 'samsungSdkHeartRate',
  size: 4,
  format: 'signedInt',
  littleEndian: true,
};

export const BLE_PSMS_ANNOTATION_ITEM_IBI: DEVICE_ANNOTATION_ITEM = {
  type: 'interbeatInterval',
  size: 16,
  format: 'signedInt',
  littleEndian: true,
  channels: 4,
};

export const BLE_PSMS_ANNOTATION_ITEM_PPG_GREEN: DEVICE_ANNOTATION_ITEM = {
  type: 'ppgGreen',
  size: 4,
  format: 'signedInt',
  littleEndian: true,
};

export const BLE_PSMS_ANNOTATION_ITEM_PPG_RED: DEVICE_ANNOTATION_ITEM = {
  type: 'ppgRed',
  size: 4,
  format: 'signedInt',
  littleEndian: true,
};

export const BLE_PSMS_ANNOTATION_ITEM_PPG_IR: DEVICE_ANNOTATION_ITEM = {
  type: 'ppgInfrared',
  size: 4,
  format: 'signedInt',
  littleEndian: true,
};

export const BLE_PSMS_ANNOTATION_ITEM_ACCELERATION: DEVICE_ANNOTATION_ITEM = {
  type: 'samsungSdkAcceleration',
  size: 6,
  format: 'signedInt',
  littleEndian: true,
  channels: 3,
  channelLabels: ['x', 'y', 'z'],
};

export const BLE_PSMS_ANNOTATION_ITEM_IBI_INDEX: DEVICE_ANNOTATION_ITEM = {
  type: 'samsungSdkIbiIndex',
  size: 2,
  format: 'unsignedInt',
  littleEndian: true,
};

export const BLE_PSMS_ANNOTATION_ITEM_IBI_VALUE: DEVICE_ANNOTATION_ITEM = {
  type: 'samsungSdkInterbeatInterval',
  size: 4,
  format: 'signedInt',
  littleEndian: true,
  unit: 'ms',
};

export const BLE_PSMS_ANNOTATION_ITEM_IBI_STATUS: DEVICE_ANNOTATION_ITEM = {
  type: 'samsungSdkIbiStatus',
  size: 1,
  format: 'unsignedInt',
};

export const BLE_PSMS_ANNOTATION_ITEM_SKIN_TEMPERATURE: DEVICE_ANNOTATION_ITEM = {
  type: 'skinTemperature',
  size: 4,
  format: 'float32',
  littleEndian: true,
};
// #endregion

// ====================
// #region Annotations
// ====================

export const IMUAnnotation: DEVICE_ANNOTATION = [
  DEVICE_ANNOTATION_ITEM_ACCELERATION,
  DEVICE_ANNOTATION_ITEM_ANGULAR_SPEED,
  DEVICE_ANNOTATION_ITEM_MAGNETIC_FIELD,
];

export const PAMSGeneralActivityInstantaneousAnnotation: DEVICE_ANNOTATION = [
  BLE_PAMS_ANNOTATION_ITEM_SPEED,
  BLE_PAMS_ANNOTATION_ITEM_MOTION_CADENCE,
  BLE_PAMS_ANNOTATION_ITEM_ABSOLUTE_ELEVATION,
];

export const PAMSGeneralActivitySummaryAnnotation: DEVICE_ANNOTATION = [
  BLE_PAMS_ANNOTATION_ITEM_CALORIES_TOTAL,
  BLE_PAMS_ANNOTATION_ITEM_DISTANCE_TOTAL,
  BLE_PAMS_ANNOTATION_ITEM_MINIMUM_SPEED,
  BLE_PAMS_ANNOTATION_ITEM_MAXIMUM_SPEED,
  BLE_PAMS_ANNOTATION_ITEM_AVERAGE_SPEED,
  BLE_PAMS_ANNOTATION_ITEM_MINIMUM_MOTION_CADENCE,
  BLE_PAMS_ANNOTATION_ITEM_MAXIMUM_MOTION_CADENCE,
  BLE_PAMS_ANNOTATION_ITEM_AVERAGE_MOTION_CADENCE,
  BLE_PAMS_ANNOTATION_ITEM_FLOORS_TOTAL,
  BLE_PAMS_ANNOTATION_ITEM_POSITIVE_ELEVATION_GAIN,
  BLE_PAMS_ANNOTATION_ITEM_NEGATIVE_ELEVATION_GAIN,
];

export const PAMSCardioVascularActivityAnnotation: DEVICE_ANNOTATION = [
  BLE_PAMS_ANNOTATION_ITEM_HEART_RATE,
  BLE_PAMS_ANNOTATION_ITEM_VO2_MAX,
];

export const PAMSStepCounterActivitySummaryAnnotation: DEVICE_ANNOTATION = [
  BLE_PAMS_ANNOTATION_ITEM_STEPS_TOTAL,
  BLE_PAMS_ANNOTATION_ITEM_RUNNING_STEPS_TOTAL,
];

export const CPMSHealthServicesPassiveDataAnnotation: DEVICE_ANNOTATION = [
  DEVICE_D4L_COMPANION_ANNOTATION_ITEM_TIMESTAMP,
  BLE_CPMS_ANNOTATION_ITEM_DAILY_STEPS,
  BLE_CPMS_ANNOTATION_ITEM_DAILY_DISTANCE,
  BLE_CPMS_ANNOTATION_ITEM_DAILY_CALORIES,
  BLE_CPMS_ANNOTATION_ITEM_DAILY_FLOORS,
  BLE_CPMS_ANNOTATION_ITEM_DAILY_ELEVATION_GAIN,
];

export const CPMSHealthServicesActivityDetectionAnnotation: DEVICE_ANNOTATION = [
  DEVICE_D4L_COMPANION_ANNOTATION_ITEM_TIMESTAMP,
  BLE_CPMS_ANNOTATION_ITEM_ACTIVITY_TYPE,
];

export const ASMSECGMeasurementAnnotation: DEVICE_ANNOTATION = [
  DEVICE_D4L_COMPANION_ANNOTATION_ITEM_TIMESTAMP,
  BLE_ASMS_ANNOTATION_ITEM_ECG,
];

export const ASMSSpO2MeasurementAnnotation: DEVICE_ANNOTATION = [
  DEVICE_D4L_COMPANION_ANNOTATION_ITEM_TIMESTAMP,
  BLE_ASMS_ANNOTATION_ITEM_SPO2,
];

export const PSMSHeartRateAnnotation: DEVICE_ANNOTATION = [
  DEVICE_D4L_COMPANION_ANNOTATION_ITEM_TIMESTAMP,
  BLE_PSMS_ANNOTATION_ITEM_HEART_RATE,
  BLE_PSMS_ANNOTATION_ITEM_IBI,
];

export const PSMSSkinTemperatureAnnotation: DEVICE_ANNOTATION = [
  DEVICE_D4L_COMPANION_ANNOTATION_ITEM_TIMESTAMP,
  BLE_PSMS_ANNOTATION_ITEM_SKIN_TEMPERATURE,
];

export const PSMSPPGGreenAnnotation: DEVICE_ANNOTATION = [
  DEVICE_D4L_COMPANION_ANNOTATION_ITEM_TIMESTAMP,
  BLE_PSMS_ANNOTATION_ITEM_PPG_GREEN,
];

export const PSMSPPGRedAnnotation: DEVICE_ANNOTATION = [
  DEVICE_D4L_COMPANION_ANNOTATION_ITEM_TIMESTAMP,
  BLE_PSMS_ANNOTATION_ITEM_PPG_RED,
];

export const PSMSPPGIRAnnotation: DEVICE_ANNOTATION = [
  DEVICE_D4L_COMPANION_ANNOTATION_ITEM_TIMESTAMP,
  BLE_PSMS_ANNOTATION_ITEM_PPG_IR,
];

export const PSMSAccelerationAnnotation: DEVICE_ANNOTATION = [
  DEVICE_D4L_COMPANION_ANNOTATION_ITEM_TIMESTAMP,
  BLE_PSMS_ANNOTATION_ITEM_ACCELERATION,
];

// One row per IBI: the timestamp is the SDK reading that carried the IBI, the index keeps the beat order
export const PSMSIBIAnnotation: DEVICE_ANNOTATION = [
  DEVICE_D4L_COMPANION_ANNOTATION_ITEM_TIMESTAMP,
  BLE_PSMS_ANNOTATION_ITEM_IBI_INDEX,
  BLE_PSMS_ANNOTATION_ITEM_IBI_VALUE,
  BLE_PSMS_ANNOTATION_ITEM_IBI_STATUS,
];

// #endregion

export const WearOS3AnnotationMap: { [key in DEVICE_SIGNAL_TYPE]?: DEVICE_ANNOTATION[] } = {
  imu: [IMUAnnotation],
  heartRate: [DEVICE_ANNOTATION_HEARTRATE],
  physicalActivityMonitoring: [
    PAMSGeneralActivityInstantaneousAnnotation,
    PAMSGeneralActivitySummaryAnnotation,
    PAMSCardioVascularActivityAnnotation,
    PAMSStepCounterActivitySummaryAnnotation,
  ],
  customPassiveMonitoring: [
    CPMSHealthServicesPassiveDataAnnotation,
    CPMSHealthServicesActivityDetectionAnnotation,
  ],
  activeSamsungSDKMonitoring: [ASMSECGMeasurementAnnotation, ASMSSpO2MeasurementAnnotation],
  passiveSamsungSDKMonitoring: [
    PSMSHeartRateAnnotation,
    PSMSSkinTemperatureAnnotation,
    PSMSPPGGreenAnnotation,
    PSMSPPGRedAnnotation,
    PSMSPPGIRAnnotation,
    PSMSAccelerationAnnotation,
    PSMSIBIAnnotation,
  ],
};
