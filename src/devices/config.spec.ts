import { ProgramDevice } from '../types';
import { HEALTH_CONNECT_EXERCISE_SIGNAL_TYPES } from './annotations/healthConnect';
import { toDeviceConfig } from './config';

const createDevice = (overrides: Partial<ProgramDevice>): ProgramDevice => ({
  type: 'HealthConnect',
  dataTypes: [],
  ...overrides,
});

describe('toDeviceConfig', () => {
  it('expands the Health Connect exercise data type into its signal types', () => {
    // Arrange
    const devices = [createDevice({ dataTypes: ['steps', 'exercise'] })];

    // Act
    const [config] = toDeviceConfig(devices);

    // Assert
    expect(config).toEqual({
      type: 'sdk',
      device: 'HealthConnect',
      dataTypes: ['steps', ...HEALTH_CONNECT_EXERCISE_SIGNAL_TYPES],
    });
  });
});
