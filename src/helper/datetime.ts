/**
 * Transform a string to a Date
 * @param dateString A date string (YYYY-MM-DD)
 * @returns The Date
 */
export const stringToDate = (dateString: string): Date | undefined => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return undefined;
  }

  return date;
};

/**
 * Transform a string to a year
 * @param yearString The year string (YYYY)
 * @returns The year as a number
 */
export const stringToYear = (yearString: string): number | undefined => {
  if (!isYearString(yearString)) {
    return undefined;
  }

  return parseInt(yearString, 10);
};

export const isYearString = (year: string): boolean => {
  if (typeof year !== 'string') {
    return false;
  }
  const regEx = /^(1|2|3|4|5|6|7|8|9)\d{3}$/;
  return year.match(regEx) != null;
};
