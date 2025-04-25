import { ProgramDevice } from '../types';
import { InternalSensorAnnotationTypes } from './annotations/internal';
import { DEVICE_ANNOTATION_DATA_TYPE } from './annotations/types';
import { BleDeviceMetaLabel, DEVICE_KEY_INTERNAL, DeviceConfig } from './types';

export function toDeviceConfig(devices: ProgramDevice[]): DeviceConfig[] {
  const internalConfigs: DeviceConfig[] = (
    devices.find(({ type }) => type === 'INTERNAL')?.dataTypes || []
  ).map((dataType) => ({
    type: 'internal',
    device: dataType as DEVICE_KEY_INTERNAL,
    dataTypes: [InternalSensorAnnotationTypes[dataType as DEVICE_KEY_INTERNAL]!],
  }));

  const bleConfigs: DeviceConfig[] = devices
    .filter(({ type }) => type && type !== 'INTERNAL' && type != 'DEXCOM')
    .filter(({ dataTypes }) => dataTypes.length)
    .map(({ type, dataTypes, labels = [], streamingMode, outputRate, sensorDelay }) => {
      return {
        type: 'ble',
        device: type as any,
        dataTypes: dataTypes.map((dataType) => dataType as DEVICE_ANNOTATION_DATA_TYPE),
        labels: labels.map((label) => ({
          device: type,
          de: label.de ?? label.en ?? label.name,
          en: label.en ?? label.de ?? label.name,
          name: label.name,
        })) as BleDeviceMetaLabel[],
        outputRate,
        streamingMode,
        sensorDelay,
      };
    });
  return [...internalConfigs, ...bleConfigs];
}
