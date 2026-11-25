import { addDays } from 'date-fns';
import { Settings } from 'luxon';
import { getTimeFuncs, TimeFuncs } from './timefuncs';

const NY = 'America/New_York';
const BLN = 'Europe/Berlin';

const frequencyStart = '2019-06-17T10:00:00.000Z';
const baseDate = new Date('2020-07-01T10:00:00.000+02:00');
const baseDateNY = '2020-07-01T10:00:00.000-04:00';
const baseDayLabel = '2020-07-01';
const baseThreeDaysLabel = '2020-06-29|2020-07-01';
const baseWeekLabel = '2020-06-29|2020-07-05';
const baseTwoWeeksLabel = '2020-06-29|2020-07-12';
const baseMonthLabel = '2020-07';
const baseTwoMonthsLabel = '2020-06|2020-07';

const twoDaysBefore = new Date('2020-06-29T10:00:00.000+02:00');
const threeDaysBefore = new Date('2020-06-28T10:00:00.000+02:00');
const oneWeekBeforeLabel = '2020-06-22|2020-06-28';

const twoDaysLater = new Date('2020-07-03T10:00:00.000+02:00');
const twoDaysLaterLabel = '2020-07-03';

const sixDaysLater = new Date('2020-07-07T10:00:00.000+02:00');
const nineDaysBefore = new Date('2020-06-22T10:00:00.000+02:00');

const oneWeekLater = new Date('2020-07-08T10:00:00.000+02:00');
const oneWeekLaterLabel = '2020-07-06|2020-07-12';

const twoWeeksLater = new Date('2020-07-15T10:00:00.000+02:00');
const twoWeeksLaterLabel = '2020-07-13|2020-07-26';

const twoWeeksBefore = new Date('2020-06-17T10:00:00.000+02:00');
const twoWeekBeforeLabel = '2020-06-15|2020-06-21';

const twoMonthsLater = new Date('2020-09-01T10:00:00.000+02:00');
const threeMonthsEarlier = new Date('2020-04-01T10:00:00.000+02:00');
// DST change adjusted
const fourMonthsEarlier = new Date('2020-03-01T10:00:00.000+01:00');

const dayWindow = {
  start: new Date('2020-07-01T10:00:00.000+02:00'),
  end: new Date('2020-07-01T23:59:59.999+02:00'),
};

const dayWindowNY = {
  start: new Date('2020-07-01T10:00:00.000-04:00'),
  end: new Date('2020-07-01T23:59:59.999-04:00'),
};

const threeDaysWindow = {
  start: new Date('2020-07-02T10:00:00.000+02:00'),
  end: new Date('2020-07-04T23:59:59.999+02:00'),
};

const threeDaysWindowNY = {
  start: new Date('2020-07-02T10:00:00.000-04:00'),
  end: new Date('2020-07-04T23:59:59.999-04:00'),
};

const weekWindow = {
  start: new Date('2020-06-29T10:00:00.000+02:00'),
  end: new Date('2020-07-05T23:59:59.999+02:00'),
};

const weekWindowDST = {
  start: new Date('2020-03-23T10:00:00.000+01:00'),
  end: new Date('2020-03-29T23:59:59.999+02:00'),
};

const weekWindowNY = {
  start: new Date('2020-06-29T10:00:00.000-04:00'),
  end: new Date('2020-07-05T23:59:59.999-04:00'),
};

const twoWeekWindow = {
  start: new Date('2020-06-29T10:00:00.000+02:00'),
  end: new Date('2020-07-12T23:59:59.999+02:00'),
};

const twoWeekWindowNY = {
  start: new Date('2020-06-29T10:00:00.000-04:00'),
  end: new Date('2020-07-12T23:59:59.999-04:00'),
};

const monthWindow = {
  start: new Date('2020-07-01T10:00:00.000+02:00'),
  end: new Date('2020-07-31T23:59:59.999+02:00'),
};

const monthWindowNY = {
  start: new Date('2020-07-01T10:00:00.000-04:00'),
  end: new Date('2020-07-31T23:59:59.999-04:00'),
};

const twoMonthsWindow = {
  start: new Date('2020-06-01T10:00:00.000+02:00'),
  end: new Date('2020-07-31T23:59:59.999+02:00'),
};

const twoMonthsWindowNY = {
  start: new Date('2020-06-01T10:00:00.000-04:00'),
  end: new Date('2020-07-31T23:59:59.999-04:00'),
};

describe('timeFuncs', () => {
  beforeEach(() => {
    Settings.defaultZone = BLN;
  });

  describe('dayFuncs', () => {
    let dayFuncs: TimeFuncs;
    beforeEach(() => {
      dayFuncs = getTimeFuncs({ start: frequencyStart, type: 'daily' });
    });

    describe('add', () => {
      it('works', () => {
        expect(dayFuncs.add(baseDate, 2)).toEqual(twoDaysLater);
      });
      it('works with negative values', () => {
        expect(dayFuncs.add(baseDate, -3)).toEqual(threeDaysBefore);
      });
      it('does not alter the original date', () => {
        let copyDate = new Date(baseDate);
        dayFuncs.add(copyDate, 10);
        expect(copyDate).toEqual(baseDate);
      });
    });

    describe('diff', () => {
      it('works', () => {
        expect(dayFuncs.diff(twoDaysLater, baseDate)).toEqual(2);
      });
      it('works with negative values', () => {
        expect(dayFuncs.diff(threeDaysBefore, baseDate)).toEqual(-3);
      });
    });

    describe('group', () => {
      it('generates labels as expected', () => {
        expect(dayFuncs.group(baseDate)).toEqual(baseDayLabel);
        expect(dayFuncs.group(twoDaysLater)).toEqual(twoDaysLaterLabel);
      });
    });

    describe('window', () => {
      it('works', () => {
        expect(dayFuncs.window(baseDate)).toEqual(dayWindow);
      });

      it('works with overwritten startDate', () => {
        dayFuncs = getTimeFuncs({ start: frequencyStart, type: 'daily' }, baseDate);
        expect(dayFuncs.window(baseDate)).toEqual(dayWindow);
      });

      it('works for NY location', () => {
        Settings.defaultZone = NY;
        expect(dayFuncs.window(new Date(baseDateNY))).toEqual(dayWindowNY);
      });

      it('works with overwritten startDate for NY location', () => {
        Settings.defaultZone = NY;
        dayFuncs = getTimeFuncs({ start: frequencyStart, type: 'daily' }, new Date(baseDateNY));
        expect(dayFuncs.window(baseDate)).toEqual(dayWindowNY);
      });
    });
  });

  describe('dayFuncs with factor', () => {
    let dayFuncs: TimeFuncs;
    beforeEach(() => {
      dayFuncs = getTimeFuncs({ factor: 3, start: frequencyStart, type: 'daily' });
    });

    describe('add', () => {
      it('works', () => {
        expect(dayFuncs.add(baseDate, 2)).toEqual(sixDaysLater);
      });
      it('works with negative values', () => {
        expect(dayFuncs.add(baseDate, -3)).toEqual(nineDaysBefore);
      });
      it('does not alter the original date', () => {
        let copyDate = new Date(baseDate);
        dayFuncs.add(copyDate, 10);
        expect(copyDate).toEqual(baseDate);
      });
    });

    describe('diff', () => {
      it('works', () => {
        expect(dayFuncs.diff(sixDaysLater, baseDate)).toEqual(2);
      });
      it('works with negative values', () => {
        expect(dayFuncs.diff(nineDaysBefore, baseDate)).toEqual(-3);
      });
    });

    describe('group', () => {
      it('generates labels as expected', () => {
        expect(dayFuncs.group(baseDate)).toEqual(baseThreeDaysLabel);
      });
    });

    describe('window', () => {
      it('works', () => {
        expect(dayFuncs.window(addDays(baseDate, 1))).toEqual(threeDaysWindow);
      });

      it('works with overwritten startDate', () => {
        dayFuncs = getTimeFuncs({ factor: 3, start: frequencyStart, type: 'daily' }, baseDate);
        expect(dayFuncs.window(baseDate)).toEqual({
          start: new Date('2020-07-01T10:00:00.000+02:00'),
          end: new Date('2020-07-03T23:59:59.999+02:00'),
        });
      });

      it('works for NY location', () => {
        Settings.defaultZone = NY;
        expect(dayFuncs.window(addDays(baseDate, 1))).toEqual(threeDaysWindowNY);
      });

      it('works with overwritten startDate for NY location', () => {
        Settings.defaultZone = NY;
        dayFuncs = getTimeFuncs({ factor: 3, start: frequencyStart, type: 'daily' }, new Date(baseDateNY));
        expect(dayFuncs.window(baseDate)).toEqual({
          start: new Date('2020-07-01T10:00:00.000-04:00'),
          end: new Date('2020-07-03T23:59:59.999-04:00'),
        });
      });
    });
  });

  describe('weekFuncs', () => {
    let weekFuncs: TimeFuncs;
    beforeEach(() => {
      weekFuncs = getTimeFuncs({ start: frequencyStart, type: 'weekly' });
    });

    describe('add', () => {
      it('works', () => {
        expect(weekFuncs.add(baseDate, 1)).toEqual(oneWeekLater);
      });
      it('works with negative values', () => {
        expect(weekFuncs.add(baseDate, -2)).toEqual(twoWeeksBefore);
      });
      it('does not alter the original date', () => {
        let copyDate = new Date(baseDate);
        weekFuncs.add(copyDate, 10);
        expect(copyDate).toEqual(baseDate);
      });
    });

    describe('diff', () => {
      it('works', () => {
        expect(weekFuncs.diff(twoDaysLater, baseDate)).toEqual(0);
        expect(weekFuncs.diff(oneWeekLater, baseDate)).toEqual(1);
      });
      it('works with negative values', () => {
        expect(weekFuncs.diff(threeDaysBefore, baseDate)).toEqual(-1);
        expect(weekFuncs.diff(twoWeeksBefore, baseDate)).toEqual(-2);
      });
    });

    describe('group', () => {
      it('generates labels as expected', () => {
        expect(weekFuncs.group(baseDate)).toEqual(baseWeekLabel);
        expect(weekFuncs.group(twoDaysBefore)).toEqual(baseWeekLabel);
        expect(weekFuncs.group(threeDaysBefore)).toEqual(oneWeekBeforeLabel);
        expect(weekFuncs.group(oneWeekLater)).toEqual(oneWeekLaterLabel);
        expect(weekFuncs.group(twoWeeksBefore)).toEqual(twoWeekBeforeLabel);
      });
    });

    describe('window', () => {
      it('works', () => {
        expect(weekFuncs.window(baseDate)).toEqual(weekWindow);
      });

      it('works with overwritten startDate', () => {
        weekFuncs = getTimeFuncs({ start: frequencyStart, type: 'weekly' }, baseDate);
        expect(weekFuncs.window(baseDate)).toEqual(weekWindow);
      });

      it('works for NY location', () => {
        Settings.defaultZone = NY;
        expect(weekFuncs.window(baseDate)).toEqual(weekWindowNY);
      });

      it('works with overwritten startDate for NY location', () => {
        Settings.defaultZone = NY;
        weekFuncs = getTimeFuncs({ start: frequencyStart, type: 'weekly' }, baseDate);
        expect(weekFuncs.window(baseDate)).toEqual(weekWindowNY);
      });

      it('works crossing DST change', () => {
        const changeDay = new Date('2020-03-29T10:00:00.000+01:00');
        expect(weekFuncs.window(changeDay)).toEqual(weekWindowDST);
      });

      it('works across years', () => {
        const day = new Date('2020-12-30T00:00:00.000+01:00');
        expect(weekFuncs.window(day)).toEqual({
          start: new Date('2020-12-28T10:00:00.000+01:00'),
          end: new Date('2021-01-03T23:59:59.999+01:00'),
        });
      });
    });
  });

  describe('weekFuncs with factor', () => {
    let weekFuncs: TimeFuncs;
    beforeEach(() => {
      weekFuncs = getTimeFuncs({ factor: 2, start: frequencyStart, type: 'weekly' });
    });

    describe('add', () => {
      it('works', () => {
        expect(weekFuncs.add(baseDate, 1)).toEqual(twoWeeksLater);
      });
      it('works with negative values', () => {
        expect(weekFuncs.add(baseDate, -1)).toEqual(twoWeeksBefore);
      });
      it('does not alter the original date', () => {
        let copyDate = new Date(baseDate);
        weekFuncs.add(copyDate, 10);
        expect(copyDate).toEqual(baseDate);
      });
    });

    describe('diff', () => {
      it('works', () => {
        expect(weekFuncs.diff(twoDaysLater, baseDate)).toEqual(0);
        expect(weekFuncs.diff(twoWeeksLater, baseDate)).toEqual(1);
      });
      it('works with negative values', () => {
        expect(weekFuncs.diff(threeDaysBefore, baseDate)).toEqual(-1);
        expect(weekFuncs.diff(twoWeeksBefore, baseDate)).toEqual(-1);
      });
    });

    describe('group', () => {
      it('generates labels as expected', () => {
        expect(weekFuncs.group(baseDate)).toEqual(baseTwoWeeksLabel);
        expect(weekFuncs.group(twoDaysBefore)).toEqual(baseTwoWeeksLabel);
        expect(weekFuncs.group(oneWeekLater)).toEqual(baseTwoWeeksLabel);
        expect(weekFuncs.group(twoWeeksLater)).toEqual(twoWeeksLaterLabel);
      });
    });

    describe('window', () => {
      it('works', () => {
        expect(weekFuncs.window(baseDate)).toEqual(twoWeekWindow);
      });

      it('works with overwritten startDate', () => {
        weekFuncs = getTimeFuncs({ factor: 2, start: frequencyStart, type: 'weekly' }, baseDate);
        expect(weekFuncs.window(baseDate)).toEqual(twoWeekWindow);
      });

      it('works for NY location', () => {
        Settings.defaultZone = NY;
        expect(weekFuncs.window(baseDate)).toEqual(twoWeekWindowNY);
      });

      it('works with overwritten startDate for NY location', () => {
        Settings.defaultZone = NY;
        weekFuncs = getTimeFuncs({ factor: 2, start: frequencyStart, type: 'weekly' }, baseDate);
        expect(weekFuncs.window(baseDate)).toEqual(twoWeekWindowNY);
      });

      it('works in the middle of the month', () => {
        const actual = weekFuncs.window(new Date('2021-03-26T10:00:00.000+01:00'));
        const expected = {
          start: new Date('2021-03-22T10:00:00.000+01:00'),
          end: new Date('2021-04-04T23:59:59.999+02:00'),
        };
        expect(actual).toEqual(expected);
      });

      it('works across years', () => {
        const day = new Date('2020-12-30T00:00:00.000+01:00');
        expect(weekFuncs.window(day)).toEqual({
          start: new Date('2020-12-28T10:00:00.000+01:00'),
          end: new Date('2021-01-10T23:59:59.999+01:00'),
        });
      });
    });
  });

  describe('monthFuncs', () => {
    let monthFuncs: TimeFuncs;
    beforeAll(() => {
      monthFuncs = getTimeFuncs({ start: frequencyStart, type: 'monthly' });
    });

    describe('add', () => {
      it('works', () => {
        expect(monthFuncs.add(baseDate, 2)).toEqual(twoMonthsLater);
      });
      it('works with negative values', () => {
        expect(monthFuncs.add(baseDate, -3)).toEqual(threeMonthsEarlier);
      });
      it('does not alter the original date', () => {
        let copyDate = new Date(baseDate);
        monthFuncs.add(copyDate, 10);
        expect(copyDate).toEqual(baseDate);
      });
    });

    describe('diff', () => {
      it('works', () => {
        expect(monthFuncs.diff(twoMonthsLater, baseDate)).toEqual(2);
      });
      it('works with negative values', () => {
        expect(monthFuncs.diff(threeMonthsEarlier, baseDate)).toEqual(-3);
      });
    });

    describe('group', () => {
      it('generates labels as expected', () => {
        expect(monthFuncs.group(baseDate)).toEqual(baseMonthLabel);
      });
    });

    describe('window', () => {
      it('works', () => {
        expect(monthFuncs.window(baseDate)).toEqual(monthWindow);
      });

      it('works for NY location', () => {
        Settings.defaultZone = NY;
        expect(monthFuncs.window(baseDate)).toEqual(monthWindowNY);
      });
    });
  });

  describe('monthFuncs with factor', () => {
    let monthFuncs: TimeFuncs;
    beforeAll(() => {
      monthFuncs = getTimeFuncs({ factor: 2, start: frequencyStart, type: 'monthly' });
    });

    describe('add', () => {
      it('works', () => {
        expect(monthFuncs.add(baseDate, 1)).toEqual(twoMonthsLater);
      });
      it('works with negative values', () => {
        expect(monthFuncs.add(baseDate, -2)).toEqual(fourMonthsEarlier);
      });
      it('does not alter the original date', () => {
        let copyDate = new Date(baseDate);
        monthFuncs.add(copyDate, 10);
        expect(copyDate).toEqual(baseDate);
      });
    });

    describe('diff', () => {
      it('works', () => {
        expect(monthFuncs.diff(twoMonthsLater, baseDate)).toEqual(1);
      });
      it('works with negative values', () => {
        expect(monthFuncs.diff(fourMonthsEarlier, baseDate)).toEqual(-2);
      });
    });

    describe('group', () => {
      it('generates labels as expected', () => {
        expect(monthFuncs.group(baseDate)).toEqual(baseTwoMonthsLabel);
      });
    });

    describe('window', () => {
      it('works', () => {
        expect(monthFuncs.window(baseDate)).toEqual(twoMonthsWindow);
      });

      it('works for NY location', () => {
        Settings.defaultZone = NY;
        expect(monthFuncs.window(baseDate)).toEqual(twoMonthsWindowNY);
      });
    });
  });
});
