import { DateTime, DateTimeUnit } from 'luxon';
import { FrequencySubset, TimeWindow } from './types';
import { dayFormat, overwriteTime } from './utils';

/**
 * Returns the timeFuncs for the given parameters.
 * Can be used with task.frequency and an optional overwrite for the startDate
 * @param parameters subset of task frequency
 * @param startDate startDate as a means to overwrite date part of the frequency start
 * @returns
 */
export const getTimeFuncs = (parameters: FrequencySubset, startDate?: Date): TimeFuncs => {
  const { type } = parameters;
  const overrideStart = overwriteTime(startDate, parameters.start);
  const params = overrideStart
    ? {
        ...parameters,
        // Use DateTime ISO string to retain proper time when converting to ISO (JS date automatically converts to UTC)
        start: DateTime.fromJSDate(overrideStart).toISO() ?? parameters.start,
      }
    : parameters;
  switch (type) {
    case 'daily':
      return new DayFuncs(params);
    case 'weekly':
      return new WeekFuncs(params);
    case 'monthly':
      return new MonthFuncs(params);
    default:
      return new DayFuncs(params);
  }
};

/**
 * Abstract class for functions to manipulate time based on a given window size
 */
export abstract class TimeFuncs {
  abstract unit: DateTimeUnit;
  public factor: number = 1;
  public start?: string;

  constructor(parameters?: { factor?: number; start?: string }) {
    if (parameters) {
      if (parameters.factor !== undefined && parameters.factor > 1) {
        this.factor = parameters.factor;
      }
      if (parameters?.start && DateTime.fromISO(parameters.start).isValid) {
        this.start = parameters.start;
      }
    }
  }

  abstract addFunc(base: Date, x: number): Date;
  public add(base: Date, x: number): Date {
    return this.addFunc(base, x * this.factor);
  }

  abstract diffFunc(later: Date, earlier: Date): number;
  public diff(later: Date, earlier: Date): number {
    return Math.floor(this.diffFunc(later, earlier) / this.factor);
  }

  abstract formatFunc(date: Date): string;
  public group(date: Date): string {
    if (this.factor > 1) {
      const window = this.window(date);
      return `${this.formatFunc(window.start)}|${this.formatFunc(window.end)}`;
    }
    return this.formatFunc(date);
  }

  private startOfUnit(date: Date): Date {
    let luxonDate = DateTime.fromJSDate(date);
    return overwriteTime(luxonDate.startOf(this.unit).toJSDate(), this.start) ?? luxonDate.toJSDate();
  }

  private endOfUnit(date: Date): Date {
    let luxonDate = DateTime.fromJSDate(date);
    return luxonDate.endOf(this.unit).toJSDate();
  }

  public window(date: Date): TimeWindow {
    if (this.factor > 1 && this.start !== undefined) {
      const start = this.startOfUnit(new Date(this.start));
      const current = this.startOfUnit(date);
      const offset = this.diffFunc(current, start) % this.factor;
      return {
        start: this.addFunc(current, -offset),
        end: this.endOfUnit(this.addFunc(current, this.factor - offset - 1)),
      };
    }
    return {
      start: this.startOfUnit(date),
      end: this.endOfUnit(date),
    };
  }
}

class DayFuncs extends TimeFuncs {
  unit = 'day' as DateTimeUnit;
  addFunc = (base: Date, x: number): Date => DateTime.fromJSDate(base).plus({ days: x }).toJSDate();
  diffFunc = (later: Date, earlier: Date): number =>
    DateTime.fromJSDate(later).diff(DateTime.fromJSDate(earlier), 'days').days;
  formatFunc = dayFormat;
}

class WeekFuncs extends TimeFuncs {
  unit = 'week' as DateTimeUnit;
  addFunc = (base: Date, x: number): Date => DateTime.fromJSDate(base).plus({ weeks: x }).toJSDate();
  diffFunc = (later: Date, earlier: Date): number =>
    DateTime.fromJSDate(later).diff(DateTime.fromJSDate(earlier), 'weeks').weeks;
  formatFunc = dayFormat;
  public group(date: Date): string {
    const week = this.window(date);
    return `${dayFormat(week.start)}|${dayFormat(week.end)}`;
  }
}

class MonthFuncs extends TimeFuncs {
  unit = 'month' as DateTimeUnit;
  addFunc = (base: Date, x: number): Date => DateTime.fromJSDate(base).plus({ months: x }).toJSDate();
  diffFunc = (later: Date, earlier: Date): number =>
    DateTime.fromJSDate(later).diff(DateTime.fromJSDate(earlier), 'months').months;
  formatFunc = (date: Date) => DateTime.fromJSDate(date).toFormat('yyyy-MM');
}
