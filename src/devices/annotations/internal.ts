import { DEVICE_KEY_INTERNAL } from '../types';
import { DEVICE_ANNOTATION_DATA_TYPE } from './types';

export const InternalSensorAnnotationTypes: {
  [key in DEVICE_KEY_INTERNAL]?: DEVICE_ANNOTATION_DATA_TYPE;
} = {
  internal_accelerometer: 'acceleration',
  internal_gyroscope: 'angularSpeed',
  internal_magnetometer: 'magneticField',
  internal_beacon_sensing: 'rssi',
};
