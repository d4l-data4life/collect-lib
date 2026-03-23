import { Settings } from 'luxon';
import {
  isBeforeStartDate,
  isNotAfterEndDate,
  isNotBeforeStartDate,
  overwriteTime,
  timezonelessDate,
} from './utils';

const NY = 'America/New_York';
const BLN = 'Europe/Berlin';

describe('overwriteTime', () => {
  beforeEach(() => {
    Settings.defaultZone = BLN;
  });

  it('changes the time of the date', () => {
    const frequencyStart1 = '2021-03-01T10:00:00.000+01:00';
    const subStartDate = new Date('2021-03-26T12:10:00.000Z');
    const adjustedStartDate = overwriteTime(subStartDate, frequencyStart1);
    expect(adjustedStartDate).toEqual(new Date('2021-03-26T10:00:00.000+01:00'));
  });

  it('works in a different timezone', () => {
    Settings.defaultZone = NY;
    const frequencyStart2 = '2021-03-01T10:00:00.000+01:00';
    const subStartDate = new Date('2021-03-26T12:10:00.000Z');
    const adjustedStartDate = overwriteTime(subStartDate, frequencyStart2);
    expect(adjustedStartDate).toEqual(new Date('2021-03-26T10:00:00.000-04:00'));
  });
});

describe('isNotAfterEndDate', () => {
  it('works', () => {
    const endDate = new Date('2021-02-03T00:00:00.000Z');
    expect(isNotAfterEndDate(endDate, new Date('2021-02-02T15:12:16.123Z'))).toBeTruthy();
    expect(isNotAfterEndDate(undefined, new Date('2021-02-03T00:00:00.000Z'))).toBeTruthy();
    expect(isNotAfterEndDate(endDate, new Date('2021-02-03T09:15:16.123Z'))).toBeFalsy();
    expect(isNotAfterEndDate(endDate, new Date('2021-02-03T00:00:00.000Z'))).toBeFalsy();
  });
});

describe('isNotBeforeStartDate', () => {
  it('works', () => {
    const startDate = new Date('2021-02-03T00:00:00.000Z');
    expect(isNotBeforeStartDate(startDate, new Date('2021-02-02T15:12:16.123Z'))).toBeFalsy();
    expect(isNotBeforeStartDate(startDate, new Date('2021-02-03T09:15:16.123Z'))).toBeTruthy();
    expect(isNotBeforeStartDate(undefined, new Date('2021-02-03T09:15:16.123Z'))).toBeTruthy();
  });
});

describe('isBeforeStartDate', () => {
  it('works', () => {
    const effectiveStartDate = new Date('2021-02-03T00:00:00.000Z');
    expect(
      isBeforeStartDate(effectiveStartDate, new Date('2021-02-02T15:12:16.123Z'))
    ).toBeTruthy();
    expect(isBeforeStartDate(effectiveStartDate, new Date('2021-02-03T09:15:16.123Z'))).toBeFalsy();
    expect(isBeforeStartDate(undefined, new Date('2021-02-03T09:15:16.123Z'))).toBeFalsy();
  });
});

describe('timezonelessDate', () => {
  beforeEach(() => {
    Settings.defaultZone = BLN;
  });

  it('works with UTC timestamp', () => {
    const input = '2021-03-01T10:00:00.000Z';
    const result = timezonelessDate(input);
    expect(result).toEqual(new Date('2021-03-01T10:00:00.000+01:00'));
  });

  it('works with UTC timestamp in NY timezone', () => {
    Settings.defaultZone = NY;
    const input = '2021-03-01T10:00:00.000Z';
    const result = timezonelessDate(input);
    expect(result).toEqual(new Date('2021-03-01T10:00:00.000-05:00'));
  });

  it('works with BLN timestamp in NY timezone', () => {
    Settings.defaultZone = NY;
    const input = '2021-03-01T10:00:00.000+01:00';
    const result = timezonelessDate(input);
    expect(result).toEqual(new Date('2021-03-01T10:00:00.000-05:00'));
  });

  it('works with NY timestamp in BLN timezone', () => {
    Settings.defaultZone = BLN;
    const input = '2021-03-01T10:00:00.000-05:00';
    const result = timezonelessDate(input);
    expect(result).toEqual(new Date('2021-03-01T10:00:00.000+01:00'));
  });
});
