import { ProgramDevice } from '../types';
import { InternalSensorAnnotationTypes } from './annotations/internal';
import { DEVICE_ANNOTATION_DATA_TYPE } from './annotations/types';
import { BleDeviceMetaLabel, DEVICE_KEY_INTERNAL, DEVICE_SIGNAL_TYPE, DeviceConfig } from './types';

export function toDeviceConfig(devices: ProgramDevice[]): DeviceConfig[] {
  const deviceConfigs = devices
    .filter(({ dataTypes }) => dataTypes.length)
    .flatMap((device): DeviceConfig | DeviceConfig[] => {
      switch (device.type) {
        case 'INTERNAL':
          return device.dataTypes.map((dataType) => ({
            type: 'internal',
            device: dataType as DEVICE_KEY_INTERNAL,
            dataTypes: [InternalSensorAnnotationTypes[dataType as DEVICE_KEY_INTERNAL]!],
          }));
        case 'DEXCOM':
        case 'FITBIT':
          return {
            type: 'api',
            device: device.type,
            dataTypes: device.dataTypes as DEVICE_SIGNAL_TYPE[],
          };
        case 'AppleHealth':
          return {
            type: 'health_framework',
            device: device.type,
            dataTypes: device.dataTypes as DEVICE_SIGNAL_TYPE[],
          };
        default:
          return {
            type: 'ble',
            device: device.type,
            dataTypes: device.dataTypes as DEVICE_ANNOTATION_DATA_TYPE[],
            labels: (device.labels || []).map((label) => ({
              device: device.type,
              de: label.de ?? label.en ?? label.name,
              en: label.en ?? label.de ?? label.name,
              name: label.name,
            })) as BleDeviceMetaLabel[],
            outputRate: device.outputRate,
            streamingMode: device.streamingMode,
            sensorDelay: device.sensorDelay,
          };
      }
    });

  return deviceConfigs;
}
