import { DEVICE_ANNOTATION } from '../devices/annotations/types';
import { BleDeviceMetaLabel, DEVICE_KEY, DEVICE_SIGNAL_TYPE } from '../devices/types';

export const RECORDING_SIGNAL_MODEL_CURRENT_VERSION = '0.0.8';

export interface RecordingSignalItem {
  date: Date;
  value: Uint8Array;
}

export interface RecordingSignalPreview {
  dataType: string;
  items: PreviewTimeSeriesItem[];
}

export interface PreviewTimeSeriesItem {
  date: Date;
  values: number[];
}

export interface RecordingSignal {
  version: string;
  peripheralId: string;
  recordingId: string;
  deviceKey: DEVICE_KEY;
  annotation: DEVICE_ANNOTATION;
  effectiveFrom?: string;
  effectiveTo?: string;
  duration?: number;
  vendorId?: string;
  manufacturerName?: string;
  deviceShortName?: string;
  deviceFullName?: string;
  deviceLabel?: BleDeviceMetaLabel;
  outputRate?: number;
  sensorDelay?: number;
  type?: DEVICE_SIGNAL_TYPE;
  data?: ArrayBuffer;
}
