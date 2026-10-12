import { ProgramDevicesDataType } from '../../types';
import { DEVICE_SIGNAL_TYPE } from '../types';
import { DEVICE_ANNOTATION_ITEM_DATA_SOURCE } from './base';
import {
  HEALTH_CONNECT_EXERCISE_SIGNAL_TYPES,
  HEALTH_CONNECT_SIGNAL_TYPE_ANNOTATIONS,
  toHealthConnectSignalTypes,
} from './healthConnect';

const annotationSize = (signalType: DEVICE_SIGNAL_TYPE) =>
  (HEALTH_CONNECT_SIGNAL_TYPE_ANNOTATIONS[signalType] ?? []).reduce(
    (sum, { size }) => sum + size,
    0
  );

describe('HEALTH_CONNECT_SIGNAL_TYPE_ANNOTATIONS', () => {
  it('ends every annotation with the dataSource item', () => {
    // Arrange
    const annotations = Object.values(HEALTH_CONNECT_SIGNAL_TYPE_ANNOTATIONS);

    // Act
    const lastItems = annotations.map((annotation) => annotation?.[annotation.length - 1]);

    // Assert
    lastItems.forEach((item) => expect(item).toBe(DEVICE_ANNOTATION_ITEM_DATA_SOURCE));
  });

  it.each<[DEVICE_SIGNAL_TYPE, number]>([
    ['exerciseSession', 2 + 4 + 16],
    ['exerciseCalories', 4 + 4 + 16],
    ['exerciseDistance', 4 + 4 + 16],
    ['exerciseHeartRate', 2 + 16],
    ['exercisePower', 4 + 16],
    ['exerciseSpeed', 4 + 16],
    ['exerciseVo2max', 4 + 1 + 16],
  ])('encodes %s rows in %i bytes', (signalType, expectedSize) => {
    // Arrange
    const type = signalType;

    // Act
    const size = annotationSize(type);

    // Assert
    expect(size).toBe(expectedSize);
  });
});

describe('toHealthConnectSignalTypes', () => {
  it('expands exercise into all exercise signal types', () => {
    // Arrange
    const dataTypes: ProgramDevicesDataType[] = ['steps', 'exercise', 'sleep'];

    // Act
    const signalTypes = toHealthConnectSignalTypes(dataTypes);

    // Assert
    expect(signalTypes).toEqual(['steps', ...HEALTH_CONNECT_EXERCISE_SIGNAL_TYPES, 'sleep']);
  });

  it('keeps the data types unchanged when exercise is not selected', () => {
    // Arrange
    const dataTypes: ProgramDevicesDataType[] = ['steps', 'spo2'];

    // Act
    const signalTypes = toHealthConnectSignalTypes(dataTypes);

    // Assert
    expect(signalTypes).toEqual(['steps', 'spo2']);
  });

  it('has an annotation for every exercise signal type', () => {
    // Arrange
    const signalTypes = HEALTH_CONNECT_EXERCISE_SIGNAL_TYPES;

    // Act
    const missing = signalTypes.filter((type) => !HEALTH_CONNECT_SIGNAL_TYPE_ANNOTATIONS[type]);

    // Assert
    expect(missing).toEqual([]);
  });
});
