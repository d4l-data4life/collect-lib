import { FrequencyType } from '../types';

export type TimeWindow = {
  start: Date;
  end: Date;
};

/**
 * Subset of TaskFrequency type required for time functions.
 * Start is an ISO 8601 timestamp indicating the starting point for the frequency subset.
 */
export type FrequencySubset = {
  factor?: number;
  start?: string;
  type: FrequencyType;
};
