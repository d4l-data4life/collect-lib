import {
  ACTIVITY_DETECTION_LABELS,
  SLEEP_LEVEL_LABELS,
} from './categoricalLabels';
import { FITBIT_SLEEP_LEVEL_MAP } from './fitbit';

describe('categoricalLabels', () => {
  describe('SLEEP_LEVEL_LABELS', () => {
    it('round-trips every code in FITBIT_SLEEP_LEVEL_MAP back to its label', () => {
      Object.entries(FITBIT_SLEEP_LEVEL_MAP).forEach(([label, code]) => {
        expect(SLEEP_LEVEL_LABELS[code]).toBe(label);
      });
    });
  });

  describe('ACTIVITY_DETECTION_LABELS', () => {
    it('has exactly the four codes written by the Wear OS companion app', () => {
      expect(ACTIVITY_DETECTION_LABELS).toStrictEqual({
        0: 'unknown',
        1: 'exercise',
        2: 'passive',
        3: 'asleep',
      });
    });
  });
});
