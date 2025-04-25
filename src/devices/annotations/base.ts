import { DEVICE_ANNOTATION_ITEM } from './types';

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
