import { toDeviceConfig } from './config';

describe('toDeviceConfig', () => {
  describe('BLE device labels', () => {
    it('should keep translations for all program languages', () => {
      const [config] = toDeviceConfig([
        {
          type: 'DOT',
          dataTypes: ['eulerAngles'],
          labels: [
            { name: 'DOT_0', en: 'Left wrist', de: 'Linkes Handgelenk', fr: 'Poignet gauche' },
          ],
        },
      ]);

      expect(config).toMatchObject({
        type: 'ble',
        labels: [
          {
            device: 'DOT',
            name: 'DOT_0',
            en: 'Left wrist',
            de: 'Linkes Handgelenk',
            fr: 'Poignet gauche',
          },
        ],
      });
    });

    it('should fill de/en from each other or the name when missing', () => {
      const [config] = toDeviceConfig([
        {
          type: 'DOT',
          dataTypes: ['eulerAngles'],
          labels: [
            { name: 'DOT_0', en: 'Left wrist' },
            { name: 'DOT_1', fr: 'Poignet droit' },
          ],
        },
      ]);

      expect(config).toMatchObject({
        labels: [
          { device: 'DOT', name: 'DOT_0', en: 'Left wrist', de: 'Left wrist' },
          { device: 'DOT', name: 'DOT_1', en: 'DOT_1', de: 'DOT_1', fr: 'Poignet droit' },
        ],
      });
    });
  });
});
