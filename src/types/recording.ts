import { DEVICE_KEY } from '../devices';
import { DEVICE_ANNOTATION_DATA_TYPE } from '../devices/annotations/types';

export const RECORDING_MODEL_CURRENT_VERSION = '0.0.6';

export interface Recording {
  version: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  duration?: number;
  tags: RecordingTag[];
  deviceKeys: DEVICE_KEY[];
  dataTypes: DEVICE_ANNOTATION_DATA_TYPE[];
  note?: string;
  routine?: string;
  isPassive?: boolean;
  isSkipped?: boolean;
}

export type RecordingTag = {
  id: string;
  start: string;
  end?: string;
  code: string;
  labels: { [key: string]: string };
};
