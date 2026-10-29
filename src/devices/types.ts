import { TranslatedString } from '../types';
import { DEVICE_ANNOTATION_DATA_TYPE } from './annotations/types';

// TODO: This should be consolidated with ProgramDevices
export type DeviceConfig =
  | BLEDeviceConfig
  | InternalDeviceConfig
  | APIDeviceConfig
  | SDKDeviceConfig;

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

export interface SDKDeviceConfig extends BaseDeviceConfig {
  type: 'sdk';
  device: DEVICE_KEY_SDK;
  dataTypes: DEVICE_SIGNAL_TYPE[];
}

export type BleDeviceMetaLabel = {
  device: string;
  name: string;
} & TranslatedString;

export type DEVICE_KEY = DEVICE_KEY_BLE | DEVICE_KEY_API | DEVICE_KEY_SDK | DEVICE_KEY_INTERNAL;

export type DEVICE_KEY_BLE = 'DOT' | 'OH1' | 'H10' | 'EstimoteUWB' | 'PixelWatch' | 'GalaxyWatch6';

export type DEVICE_KEY_API =
  | 'FITBIT'
  | 'GOOGLE_HEALTH'
  | 'OURA'
  | 'GARMIN'
  | 'LINE_SYSTEMS'
  | 'DEXCOM'
  | 'dexcom_g4'
  | 'dexcom_g5'
  | 'dexcom_g6'
  | 'dexcom_g6+'
  | 'dexcom_g7';

export type DEVICE_KEY_SDK = 'AppleHealth' | 'HealthConnect';

export type DEVICE_KEY_INTERNAL =
  | 'INTERNAL'
  | 'internal_accelerometer'
  | 'internal_gyroscope'
  | 'internal_magnetometer'
  | 'internal_beacon_sensing';

export type DEVICE_MOVELLA_PAYLOAD_MODES = 'completeEuler' | 'customMode1' | 'rateQuantities';

export type DEVICE_SIGNAL_TYPE_APPLE =
  | 'stepCount'
  | 'sleepAnalysis'
  | 'walkingAndRunningDistance'
  | 'activeEnergy'
  | 'heartRate'
  | 'restingHeartRate'
  | 'hrv'
  | 'respiratoryRate'
  | 'spo2'
  | 'skinTemperature'
  | 'workout'
  | 'standHours'
  | 'activitySummary'
  | 'menstrualCycle'
  | 'contraceptive'
  | 'pregnancy'
  | 'lactation';

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
  | 'hrv'
  | 'respiratoryRate'
  | 'steps'
  | 'calories'
  | 'sleep'
  | 'skinTemperature'
  | 'spo2'
  | 'menstrualCycle'
  | 'dailyFloors'
  | 'dailyDistance'
  | 'bodyBattery'
  | 'sleepScore'
  | 'vo2max'
  | 'bodyComposition'
  | 'bloodPressure'
  // Google Health types
  | 'distance'
  | 'floors'
  | 'elevationGain'
  | 'activeZoneMinutes'
  // Health Connect types
  | 'exercise'
  | 'speed'
  | 'power'
  // Apple Health types
  | DEVICE_SIGNAL_TYPE_APPLE
  // Oura types
  | 'stress'
  | 'workout'
  | 'tag'
  | 'cardiovascularAge'
  | 'activity'
  | 'batteryLevel'
  // Line Systems (Line Portal) types
  | 'cgm'
  | 'bolus'
  | 'basal'
  | 'bgm'
  | 'deviceEvents';

export type DeviceName = {
  shortName: string;
  fullName: string;
};

export const DEVICE_KEY_TO_NAME: Record<DEVICE_KEY, DeviceName> = {
  DOT: { shortName: 'Movella DOT', fullName: 'Movella DOT' },
  OH1: { shortName: 'Polar OH1', fullName: 'Polar OH1' },
  H10: { shortName: 'Polar H10', fullName: 'Polar H10' },
  EstimoteUWB: { shortName: 'Estimote', fullName: 'Estimote UWB' },
  PixelWatch: { shortName: 'Pixel Watch', fullName: 'Google Pixel Watch' },
  GalaxyWatch6: { shortName: 'Galaxy Watch', fullName: 'Samsung Galaxy Watch 6' },
  FITBIT: { shortName: 'fitbit', fullName: 'fitbit' },
  GOOGLE_HEALTH: { shortName: 'Google Health', fullName: 'Google Health' },
  OURA: { shortName: 'Oura', fullName: 'Oura Ring' },
  GARMIN: { shortName: 'Garmin', fullName: 'Garmin' },
  LINE_SYSTEMS: { shortName: 'Line Systems', fullName: 'Line Systems' },
  DEXCOM: { shortName: 'Dexcom', fullName: 'Dexcom' },
  dexcom_g4: { shortName: 'Dexcom G4', fullName: 'Dexcom G4' },
  dexcom_g5: { shortName: 'Dexcom G5', fullName: 'Dexcom G5' },
  dexcom_g6: { shortName: 'Dexcom G6', fullName: 'Dexcom G6' },
  'dexcom_g6+': { shortName: 'Dexcom G6+', fullName: 'Dexcom G6+' },
  dexcom_g7: { shortName: 'Dexcom G7', fullName: 'Dexcom G7' },
  INTERNAL: { shortName: 'Internal', fullName: 'Internal Device' }, // Placeholder, there is no such device
  internal_accelerometer: {
    shortName: 'Internal Accelerometer',
    fullName: 'Internal Accelerometer',
  },
  internal_gyroscope: { shortName: 'Internal Gyroscope', fullName: 'Internal Gyroscope' },
  internal_magnetometer: { shortName: 'Internal Magnetometer', fullName: 'Internal Magnetometer' },
  internal_beacon_sensing: {
    shortName: 'Internal Beacon Sensing',
    fullName: 'Internal Beacon Sensing',
  }, // Placeholder, there is no such device
  AppleHealth: { shortName: 'Apple HealthKit', fullName: 'Apple HealthKit' },
  HealthConnect: { shortName: 'Health Connect', fullName: 'Android Health Connect' },
};
