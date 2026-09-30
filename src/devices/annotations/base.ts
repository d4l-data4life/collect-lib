import { DEVICE_ANNOTATION, DEVICE_ANNOTATION_ITEM } from './types';

export const DEVICE_ANNOTATION_TIMESTAMP_SIZE = 6;
export const DEVICE_ANNOTATION_TIMESTAMP_UNIT = 'ms';
export const DEVICE_ANNOTATION_TIMESTAMP_NOTE = 'UNIX epoch';

export const DEVICE_ANNOTATION_ITEM_UNIX_TIMESTAMP: DEVICE_ANNOTATION_ITEM = {
  type: 'timestamp',
  size: DEVICE_ANNOTATION_TIMESTAMP_SIZE,
  format: 'unsignedInt',
  littleEndian: true,
  unit: DEVICE_ANNOTATION_TIMESTAMP_UNIT,
  note: DEVICE_ANNOTATION_TIMESTAMP_NOTE,
};

export const DEVICE_ANNOTATION_ITEM_DATA_SOURCE: DEVICE_ANNOTATION_ITEM = {
  type: 'dataSource',
  size: 16,
  format: 'byte',
  littleEndian: true,
};

// Resting heart rate in bpm. Provider-neutral: Apple Health pairs it with a data source
// (HealthKit merges several devices), Garmin stores it alone.
export const DEVICE_ANNOTATION_ITEM_RESTING_HEART_RATE: DEVICE_ANNOTATION_ITEM = {
  type: 'restingHeartRate',
  size: 1,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'bpm',
};

export const DEVICE_ANNOTATION_ITEM_ACCELERATION: DEVICE_ANNOTATION_ITEM = {
  type: 'acceleration',
  size: 12,
  format: 'float32',
  channels: 3,
  channelLabels: ['x', 'y', 'z'],
  littleEndian: true,
  unit: 'm/s²',
};

export const DEVICE_ANNOTATION_ITEM_ANGULAR_SPEED: DEVICE_ANNOTATION_ITEM = {
  type: 'angularSpeed',
  size: 12,
  format: 'float32',
  channels: 3,
  channelLabels: ['x', 'y', 'z'],
  littleEndian: true,
  unit: 'rad/s',
};

export const DEVICE_ANNOTATION_ITEM_MAGNETIC_FIELD: DEVICE_ANNOTATION_ITEM = {
  type: 'magneticField',
  size: 12,
  format: 'float32',
  channels: 3,
  channelLabels: ['x', 'y', 'z'],
  littleEndian: true,
  unit: 'µT',
};

export const DEVICE_ANNOTATION_ITEM_RSSI: DEVICE_ANNOTATION_ITEM = {
  type: 'rssi',
  size: 2,
  format: 'signedInt',
  channels: 1,
  littleEndian: true,
  unit: 'dBm',
};

export const DEVICE_ANNOTATION_ITEM_BEACON_ID: DEVICE_ANNOTATION_ITEM = {
  type: 'beaconId',
  size: 16,
  format: 'byte',
  channels: 1,
  littleEndian: true,
};

export const DEVICE_ANNOTATION_ITEM_DISTANCE: DEVICE_ANNOTATION_ITEM = {
  type: 'distance',
  size: 4,
  format: 'float32',
  channels: 1,
  littleEndian: true,
  unit: 'm',
};

export const DEVICE_ANNOTATION_ITEM_REMOTE_DISTANCE: DEVICE_ANNOTATION_ITEM = {
  type: 'remoteDistance',
  size: 4,
  format: 'float32',
  channels: 1,
  littleEndian: true,
  unit: 'm',
};

export const DEVICE_ANNOTATION_ITEM_EGVS: DEVICE_ANNOTATION_ITEM = {
  type: 'egvs',
  size: 2,
  format: 'signedInt',
  channels: 1,
  littleEndian: true,
  unit: 'mg/dL',
};

export const DEVICE_ANNOTATION_ITEM_HEARTRATE: DEVICE_ANNOTATION_ITEM = {
  type: 'heartRate',
  size: 1,
  format: 'unsignedInt',
  unit: 'bpm',
};

export const DEVICE_ANNOTATION_HEARTRATE: DEVICE_ANNOTATION = [DEVICE_ANNOTATION_ITEM_HEARTRATE];

// Skin temperature expressed as a deviation from the wearer's baseline (°C), not an
// absolute temperature. Generic on purpose: any source that reports a relative skin
// temperature can point at this (currently Oura's daily_readiness.temperature_deviation).
export const DEVICE_ANNOTATION_ITEM_SKIN_TEMPERATURE_DEVIATION: DEVICE_ANNOTATION_ITEM = {
  type: 'skinTemperatureDeviation',
  size: 4,
  format: 'float32',
  littleEndian: true,
  unit: '˚C',
  note: 'delta to baseline',
};

export const DEVICE_ANNOTATION_SKIN_TEMPERATURE_DEVIATION: DEVICE_ANNOTATION = [
  DEVICE_ANNOTATION_ITEM_SKIN_TEMPERATURE_DEVIATION,
];

// HRV reported as the overnight RMSSD only (single channel). Sources that don't expose the
// full rmssd/coverage/hf/lf breakdown (e.g. Oura, which surfaces only rmssd) point here
// instead of the 4-channel Fitbit annotation, so the export is a single `hrv` column
// rather than one padded with empty coverage/hf/lf columns.
export const DEVICE_ANNOTATION_ITEM_HRV_RMSSD: DEVICE_ANNOTATION_ITEM = {
  type: 'hrv',
  size: 4,
  format: 'float32',
  littleEndian: true,
  note: 'rmssd',
};

export const DEVICE_ANNOTATION_HRV_RMSSD: DEVICE_ANNOTATION = [DEVICE_ANNOTATION_ITEM_HRV_RMSSD];
