import { DateTime } from 'luxon';

/**
 * Checks if the given date is not after the effective end date
 * @param effectiveEndDate
 * @param date
 * @returns true if there is no endDate or if the date is not after the endDate
 */
export const isNotAfterEndDate = (effectiveEndDate: Date | undefined, date: Date) => {
  return !(effectiveEndDate && date.getTime() >= effectiveEndDate.getTime());
};

/**
 *  Checks if the given date is not before the start date
 * @param startDate
 * @param date
 * @returns true if there is no startDate or if the date is not before the startDate
 */
export const isNotBeforeStartDate = (startDate: Date | undefined, date: Date) => {
  return !isBeforeStartDate(startDate, date);
};

/**
 * Checks if the given date is before the start date
 * @param start
 * @param date
 * @returns true if there is a start and the date is before the start date
 */
export const isBeforeStartDate = (start: string | Date | undefined, date: Date) =>
  start && new Date(start).getTime() > date.getTime();

/**
 * Overwrite the time of a date with a given timestamp (ignoring timezone information)
 * @param date the date the time should be applied to
 * @param timeComponent ISO 8601 timestamp string to take the time from
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
 * Converts a ISO 8601 timestamp string to a Date ignoring the timezone
 * @param input
 * @returns timestamp without timezone information
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
