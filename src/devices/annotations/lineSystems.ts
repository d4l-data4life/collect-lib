import { DEVICE_SIGNAL_TYPE } from '../types';
import { DEVICE_ANNOTATION, DEVICE_ANNOTATION_ITEM } from './types';

// Line Systems (Line Portal) device data, see https://preview-d4l.linesystems.dev/api/swagger-ui
// (integrations API). The FIELD lists of the sections are provisional pending the vendor data
// agreement; the enum code tables below are therefore placeholders that the phone maps from the
// received strings (unknown values are encoded as 255).

// #region Glucose (CGM, BGM)
// Values are stored exactly as received; the unit (`mg/dL` or `mmol/L`) is taken from the
// response and set on the recording signal's annotation via `lineSystemsGlucoseAnnotation`.
// The static items below carry the default unit only (used e.g. by Studio's data generation).
export const LINE_SYSTEMS_GLUCOSE_DEFAULT_UNIT = 'mg/dL';

export const LINE_SYSTEMS_ANNOTATION_ITEM_CGM: DEVICE_ANNOTATION_ITEM = {
  type: 'cgm',
  size: 4,
  format: 'float32',
  channels: 1,
  littleEndian: true,
  unit: LINE_SYSTEMS_GLUCOSE_DEFAULT_UNIT,
  note: 'Continuous glucose reading, stored in the unit reported by Line Portal (see unit)',
};

export const LINE_SYSTEMS_ANNOTATION_ITEM_BGM: DEVICE_ANNOTATION_ITEM = {
  type: 'bgm',
  size: 4,
  format: 'float32',
  channels: 1,
  littleEndian: true,
  unit: LINE_SYSTEMS_GLUCOSE_DEFAULT_UNIT,
  note: 'Blood glucose meter reading, stored in the unit reported by Line Portal (see unit)',
};

export const LINE_SYSTEMS_ANNOTATION_ITEM_BGM_SUB_TYPE: DEVICE_ANNOTATION_ITEM = {
  type: 'bgmSubType',
  size: 1,
  format: 'unsignedInt',
  channels: 1,
  note: 'BGM subType code: 0=unknown, 1=manual, 2=linked, 3=calibration, 255=other',
};

export const LINE_SYSTEMS_CGM_ANNOTATION: DEVICE_ANNOTATION = [LINE_SYSTEMS_ANNOTATION_ITEM_CGM];

export const LINE_SYSTEMS_BGM_ANNOTATION: DEVICE_ANNOTATION = [
  LINE_SYSTEMS_ANNOTATION_ITEM_BGM,
  LINE_SYSTEMS_ANNOTATION_ITEM_BGM_SUB_TYPE,
];

/**
 * Glucose annotation with the unit reported by Line Portal for the stored samples.
 * Falls back to the default unit when the response carries none.
 */
export const lineSystemsGlucoseAnnotation = (type: 'cgm' | 'bgm', unit?: string): DEVICE_ANNOTATION => {
  const base = type === 'cgm' ? LINE_SYSTEMS_CGM_ANNOTATION : LINE_SYSTEMS_BGM_ANNOTATION;
  return base.map((item) =>
    item.type === type ? { ...item, unit: unit || LINE_SYSTEMS_GLUCOSE_DEFAULT_UNIT } : item
  );
};
// #endregion

// #region Insulin (bolus, basal)
export const LINE_SYSTEMS_ANNOTATION_ITEM_INSULIN_ORIGIN: DEVICE_ANNOTATION_ITEM = {
  type: 'insulinOrigin',
  size: 1,
  format: 'unsignedInt',
  channels: 1,
  note: 'Insulin delivery origin code: 0=unknown, 1=manual, 2=automated, 255=other',
};

export const LINE_SYSTEMS_ANNOTATION_ITEM_BOLUS: DEVICE_ANNOTATION_ITEM = {
  type: 'bolus',
  size: 12,
  format: 'float32',
  channels: 3,
  channelLabels: ['immediate', 'extended', 'extendedDuration'],
  littleEndian: true,
  unit: 'U',
  note: 'immediate and extended insulin in U (0 if absent); extendedDuration in s',
};

export const LINE_SYSTEMS_BOLUS_ANNOTATION: DEVICE_ANNOTATION = [
  LINE_SYSTEMS_ANNOTATION_ITEM_BOLUS,
  LINE_SYSTEMS_ANNOTATION_ITEM_INSULIN_ORIGIN,
];

export const LINE_SYSTEMS_ANNOTATION_ITEM_BASAL: DEVICE_ANNOTATION_ITEM = {
  type: 'basal',
  size: 8,
  format: 'float32',
  channels: 2,
  channelLabels: ['rate', 'duration'],
  littleEndian: true,
  unit: 'U/h',
  note: 'rate in U/h; duration in s (0 if absent)',
};

export const LINE_SYSTEMS_ANNOTATION_ITEM_BASAL_STATE: DEVICE_ANNOTATION_ITEM = {
  type: 'basalState',
  size: 1,
  format: 'unsignedInt',
  channels: 1,
  note: 'Basal state code: 0=unknown, 1=scheduled, 2=temporary, 3=suspended, 255=other',
};

export const LINE_SYSTEMS_BASAL_ANNOTATION: DEVICE_ANNOTATION = [
  LINE_SYSTEMS_ANNOTATION_ITEM_BASAL,
  LINE_SYSTEMS_ANNOTATION_ITEM_BASAL_STATE,
  LINE_SYSTEMS_ANNOTATION_ITEM_INSULIN_ORIGIN,
];
// #endregion

// #region Device events (type/source codes only; `raw` and serials are not encoded)
export const LINE_SYSTEMS_ANNOTATION_ITEM_DEVICE_EVENT_TYPE: DEVICE_ANNOTATION_ITEM = {
  type: 'deviceEventType',
  size: 1,
  format: 'unsignedInt',
  channels: 1,
  note: 'Event sourceType code: 0=unknown, 1=pump, 2=cgm, 3=algorithm, 4=app, 255=other',
};

export const LINE_SYSTEMS_ANNOTATION_ITEM_DEVICE_EVENT_SOURCE: DEVICE_ANNOTATION_ITEM = {
  type: 'deviceEventSource',
  size: 1,
  format: 'unsignedInt',
  channels: 1,
  note: 'Event source code: 0=unknown, 1=trio, 2=loop, 3=nightscout, 255=other',
};

export const LINE_SYSTEMS_DEVICE_EVENTS_ANNOTATION: DEVICE_ANNOTATION = [
  LINE_SYSTEMS_ANNOTATION_ITEM_DEVICE_EVENT_TYPE,
  LINE_SYSTEMS_ANNOTATION_ITEM_DEVICE_EVENT_SOURCE,
];
// #endregion

export const LINE_SYSTEMS_SIGNAL_TYPE_ANNOTATIONS: {
  [key in DEVICE_SIGNAL_TYPE]?: DEVICE_ANNOTATION;
} = {
  cgm: LINE_SYSTEMS_CGM_ANNOTATION,
  bgm: LINE_SYSTEMS_BGM_ANNOTATION,
  bolus: LINE_SYSTEMS_BOLUS_ANNOTATION,
  basal: LINE_SYSTEMS_BASAL_ANNOTATION,
  deviceEvents: LINE_SYSTEMS_DEVICE_EVENTS_ANNOTATION,
};
