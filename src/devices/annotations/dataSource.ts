import { Buffer } from 'buffer/';

const DATA_SOURCE_BYTE_SIZE = 16;

export const APPLE_HEALTH_DATA_SOURCES = ['apple-watch', 'iphone', 'unknown'] as const;
export type AppleHealthDataSource = (typeof APPLE_HEALTH_DATA_SOURCES)[number];

export const HEALTH_CONNECT_DATA_SOURCES = [
  'internal-sensor',
  'google-fit',
  'google-health',
  'samsung-health',
  'unknown',
] as const;
export type HealthConnectDataSource = (typeof HEALTH_CONNECT_DATA_SOURCES)[number];

// Google Health: `list` names the device a point came from; the Phoenix mapper slugifies
// it (e.g. `pixel-watch-4`) and maps Google's phone-only "MobileTrack" stream to `phone`.
// Points read through `dataPoints:reconcile` carry no device and are `reconciled`. Device
// slugs are open-ended, so the type is any string; longer ones are cut to the 16-byte field.
export const GOOGLE_HEALTH_DATA_SOURCES = ['phone', 'reconciled', 'unknown'] as const;
export type GoogleHealthDataSource = (typeof GOOGLE_HEALTH_DATA_SOURCES)[number] | string;

export function encodeDataSource(
  value: AppleHealthDataSource | HealthConnectDataSource | GoogleHealthDataSource,
  size: number = DATA_SOURCE_BYTE_SIZE
): Buffer {
  const buffer = Buffer.alloc(size);
  buffer.write(value, 0, size, 'ascii');
  return buffer;
}
