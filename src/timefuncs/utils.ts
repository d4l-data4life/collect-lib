import { DateTime } from 'luxon';

export const isNotAfterEndDate = (effectiveEndDate: Date | undefined, date: Date) => {
  const result = !(effectiveEndDate && date.getTime() >= effectiveEndDate.getTime());
  return result;
};

export const isNotBeforeStartDate = (startDate: Date | undefined, date: Date) => {
  return !isBeforeStartDate(startDate, date);
};

export const isBeforeStartDate = (start: string | Date | undefined, date: Date) =>
  start && new Date(start).getTime() > date.getTime();

/**
 * Overwrite the time of a date with a given date or timestamp (using the given location)
 * @param date the date
 * @param timeComponent The date that contains the time to be used
 * @param location The location to be used for adjusting the date
 * @returns
 */
export const overwriteTime = (
  date: Date | null | undefined,
  timeComponent: string | undefined
): Date | null => {
  if (!date || !timeComponent) {
    return null;
  }
  const baseDate = timezonelessDate(timeComponent);
  if (!baseDate) {
    return null;
  }
  const baseLuxon = DateTime.fromJSDate(baseDate);
  const startLuxon = DateTime.fromJSDate(date);
  const mergedLuxon = baseLuxon.set({
    year: startLuxon.get('year'),
    month: startLuxon.get('month'),
    day: startLuxon.get('day'),
  });
  return mergedLuxon.toJSDate();
};

/**
 * Converts a ISO timestamp string to a Date ignoring the timezone
 * @param input
 * @returns
 */
export const timezonelessDate = (input: string): Date | undefined => {
  const test = DateTime.fromISO(input);
  if (test.isValid) {
    undefined;
  }
  const timezoneIndex = input.search(/[+-]\d{2}:\d{2}|Z$/);
  if (timezoneIndex > 0) {
    const withoutTimezone = input.substring(0, timezoneIndex);
    return DateTime.fromISO(withoutTimezone).toJSDate();
  }
  return test.toJSDate();
};
