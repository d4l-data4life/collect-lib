import { Buffer } from 'buffer/';

const DATA_SOURCE_BYTE_SIZE = 16;

export const APPLE_HEALTH_DATA_SOURCES = ['apple-watch', 'iphone', 'unknown'] as const;
export type AppleHealthDataSource = (typeof APPLE_HEALTH_DATA_SOURCES)[number];

export const HEALTH_CONNECT_DATA_SOURCES = [
  'internal-sensor',
  'google-fit',
  'samsung-health',
  'unknown',
] as const;
export type HealthConnectDataSource = (typeof HEALTH_CONNECT_DATA_SOURCES)[number];

export function encodeDataSource(
  value: AppleHealthDataSource | HealthConnectDataSource,
  size: number = DATA_SOURCE_BYTE_SIZE
): Buffer {
  const buffer = Buffer.alloc(size);
  buffer.write(value, 0, size, 'ascii');
  return buffer;
}
