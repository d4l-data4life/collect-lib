import { AppleHealthSleepStates, APPLE_HEALTH_SLEEP_STATE_MAP } from './appleHealth';
import { FitbitSleepLevelTypes, FITBIT_SLEEP_LEVEL_MAP } from './fitbit';
import { HealthConnectSleepStages, HEALTH_CONNECT_SLEEP_STAGE_MAP } from './healthConnect';

// Mirrored by hand from data-receiver pkg/models/signal_data.go:323 (`categoricalLabels`)
// Keep in sync by hand when either changes.

function invertLabelMap<Label extends string>(map: Record<Label, number>): Record<number, Label> {
  const inverted = {} as Record<number, Label>;
  (Object.keys(map) as Label[]).forEach((label) => {
    inverted[map[label]] = label;
  });
  return inverted;
}

export const SLEEP_LEVEL_LABELS: Record<number, FitbitSleepLevelTypes> =
  invertLabelMap(FITBIT_SLEEP_LEVEL_MAP);

export const APPLE_HEALTH_SLEEP_STATE_LABELS: Record<number, AppleHealthSleepStates> =
  invertLabelMap(APPLE_HEALTH_SLEEP_STATE_MAP);

export const HEALTH_CONNECT_SLEEP_STAGE_LABELS: Record<number, HealthConnectSleepStages> =
  invertLabelMap(HEALTH_CONNECT_SLEEP_STAGE_MAP);

// Android's androidx.health.services.client.data.UserActivityState.id
export type ActivityDetectionTypes = 'unknown' | 'exercise' | 'passive' | 'asleep';

export const ACTIVITY_DETECTION_LABELS: Record<number, ActivityDetectionTypes> = {
  0: 'unknown',
  1: 'exercise',
  2: 'passive',
  3: 'asleep',
};
