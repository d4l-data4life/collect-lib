import { DEVICE_ANNOTATION_DATA_TYPE } from './annotations/types';

// TODO: This should be consolidated with ProgramDevices
export type DeviceConfig =
  | BLEDeviceConfig
  | InternalDeviceConfig
  | APIDeviceConfig
  | HealthFrameworkConfig;

export interface BaseDeviceConfig {
  device: DEVICE_KEY;
}

export interface BLEDeviceConfig extends BaseDeviceConfig {
  type: 'ble';
  device: DEVICE_KEY_BLE;
  dataTypes: DEVICE_ANNOTATION_DATA_TYPE[];
  labels?: BleDeviceMetaLabel[];
  outputRate?: number;
  sensorDelay?: number;
  streamingMode?: DEVICE_MOVELLA_PAYLOAD_MODES;
}

export interface InternalDeviceConfig extends BaseDeviceConfig {
  type: 'internal';
  device: DEVICE_KEY_INTERNAL;
  dataTypes: DEVICE_ANNOTATION_DATA_TYPE[];
}

export interface APIDeviceConfig extends BaseDeviceConfig {
  type: 'api';
  device: DEVICE_KEY_API;
  dataTypes: DEVICE_SIGNAL_TYPE[];
}

export interface HealthFrameworkConfig extends BaseDeviceConfig {
  type: 'health_framework';
  device: DEVICE_KEY_HEALTH_FRAMEWORK;
  dataTypes: DEVICE_SIGNAL_TYPE[];
}

export interface BleDeviceMetaLabel {
  device: string;
  name: string;
  de?: string;
  en?: string;
}

export type DEVICE_KEY =
  | DEVICE_KEY_BLE
  | DEVICE_KEY_API
  | DEVICE_KEY_HEALTH_FRAMEWORK
  | DEVICE_KEY_INTERNAL;

export type DEVICE_KEY_BLE =
  | 'DOT'
  | 'OH1'
  | 'H10'
  | 'EstimoteUWB'
  | 'TicWatchE2'
  | 'PixelWatch1'
  | 'GalaxyWatch6';

export type DEVICE_KEY_API =
  | 'FITBIT'
  | 'DEXCOM'
  | 'dexcom_g4'
  | 'dexcom_g5'
  | 'dexcom_g6'
  | 'dexcom_g6+'
  | 'dexcom_g7';

export type DEVICE_KEY_HEALTH_FRAMEWORK = 'AppleHealth';

export type DEVICE_KEY_INTERNAL =
  | 'INTERNAL'
  | 'internal_accelerometer'
  | 'internal_gyroscope'
  | 'internal_magnetometer'
  | 'internal_beacon_sensing';

export type DEVICE_MOVELLA_PAYLOAD_MODES = 'completeEuler' | 'customMode1' | 'rateQuantities';

export type DEVICE_SIGNAL_TYPE =
  | 'heartRate'
  | 'imu'
  | 'beacon'
  | 'beaconUWB'
  | 'beaconRemoteUWB'
  | 'rssiScan'
  | 'physicalActivityMonitoring'
  | 'customPassiveMonitoring'
  | 'activeSamsungSDKMonitoring'
  | 'passiveSamsungSDKMonitoring'
  | 'accelerometer'
  | 'gyroscope'
  | 'magnetometer'
  | 'egvs'
  // Fitbit types
  | 'heartRateVariability'
  | 'respiratoryRate'
  | 'steps'
  | 'calories'
  | 'sleep'
  | 'skinTemperature'
  | 'spo2'
  // apple health types
  | 'stepCount'
  | 'walkingAndRunningDistance'
  | 'activeEnergy'
  | 'restingEnergy';
