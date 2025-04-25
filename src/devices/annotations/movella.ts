import { BLEDeviceConfig, DEVICE_MOVELLA_PAYLOAD_MODES } from '../types';
import { DEVICE_ANNOTATION, DEVICE_ANNOTATION_ITEM } from './types';

const DEVICE_MOVELLA_ANNOTATION_ITEM_TIMESTAMP: DEVICE_ANNOTATION_ITEM = {
  type: 'timestamp',
  size: 4,
  format: 'unsignedInt',
  littleEndian: true,
  unit: 'μs',
};

const DEVICE_MOVELLA_ANNOTATION_ITEM_EULER_ANGLES: DEVICE_ANNOTATION_ITEM = {
  type: 'eulerAngles',
  size: 12,
  format: 'float32',
  channels: 3,
  channelLabels: ['x', 'y', 'z'],
  littleEndian: true,
  unit: '°',
};

const DEVICE_MOVELLA_ANNOTATION_ITEM_FREE_ACCELERATION: DEVICE_ANNOTATION_ITEM = {
  type: 'freeAcceleration',
  size: 12,
  format: 'float32',
  channels: 3,
  channelLabels: ['x', 'y', 'z'],
  littleEndian: true,
  unit: 'm/s²',
  note: 'local earth coordinate, local gravity is deducted',
};

const DEVICE_MOVELLA_ANNOTATION_ITEM_ACCELERATION: DEVICE_ANNOTATION_ITEM = {
  type: 'acceleration',
  size: 12,
  format: 'float32',
  channels: 3,
  channelLabels: ['x', 'y', 'z'],
  littleEndian: true,
  unit: 'm/s²',
  note: 'Calibrated acceleration in sensor coordinate, m/s2',
};

const DEVICE_MOVELLA_ANNOTATION_ITEM_ANGULAR_VELOCITY: DEVICE_ANNOTATION_ITEM = {
  type: 'angularVelocity',
  size: 12,
  format: 'float32',
  channels: 3,
  channelLabels: ['x', 'y', 'z'],
  littleEndian: true,
  unit: 'dps',
};

export function getMovellaAnnotation(config: BLEDeviceConfig): DEVICE_ANNOTATION {
  return DEVICE_MOVELLA_SUPPORTED_PAYLOAD_MODES[
    config.streamingMode ?? 'customMode1'
  ].annotation.filter(
    ({ type }) => (config?.dataTypes || []).includes(type) || type === 'timestamp'
  );
}

const DEVICE_MOVELLA_SUPPORTED_PAYLOAD_MODES: {
  [key in DEVICE_MOVELLA_PAYLOAD_MODES]: {
    value: number;
    annotation: DEVICE_ANNOTATION;
  };
} = {
  completeEuler: {
    value: 16,
    annotation: [
      DEVICE_MOVELLA_ANNOTATION_ITEM_TIMESTAMP,
      DEVICE_MOVELLA_ANNOTATION_ITEM_EULER_ANGLES,
      DEVICE_MOVELLA_ANNOTATION_ITEM_FREE_ACCELERATION,
    ],
  },
  customMode1: {
    value: 22,
    annotation: [
      DEVICE_MOVELLA_ANNOTATION_ITEM_TIMESTAMP,
      DEVICE_MOVELLA_ANNOTATION_ITEM_EULER_ANGLES,
      DEVICE_MOVELLA_ANNOTATION_ITEM_FREE_ACCELERATION,
      DEVICE_MOVELLA_ANNOTATION_ITEM_ANGULAR_VELOCITY,
    ],
  },
  rateQuantities: {
    value: 21,
    annotation: [
      DEVICE_MOVELLA_ANNOTATION_ITEM_TIMESTAMP,
      DEVICE_MOVELLA_ANNOTATION_ITEM_ACCELERATION,
      DEVICE_MOVELLA_ANNOTATION_ITEM_ANGULAR_VELOCITY,
    ],
  },
};
