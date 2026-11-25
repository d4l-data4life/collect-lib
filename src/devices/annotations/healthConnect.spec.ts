import { DEVICE_SIGNAL_TYPE } from '../types';
import { DEVICE_ANNOTATION_ITEM_DATA_SOURCE } from './base';
import { HEALTH_CONNECT_SIGNAL_TYPE_ANNOTATIONS } from './healthConnect';

const annotationSize = (signalType: DEVICE_SIGNAL_TYPE) =>
  (HEALTH_CONNECT_SIGNAL_TYPE_ANNOTATIONS[signalType] ?? []).reduce((sum, { size }) => sum + size, 0);

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
    ['exercise', 2 + 4 + 16],
    ['power', 4 + 16],
    ['speed', 4 + 16],
    ['vo2max', 4 + 1 + 16],
  ])('encodes %s rows in %i bytes', (signalType, expectedSize) => {
    // Arrange
    const type = signalType;

    // Act
    const size = annotationSize(type);

    // Assert
    expect(size).toBe(expectedSize);
  });
});
