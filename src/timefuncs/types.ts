import { FrequencyType } from '../types';

export type TimeWindow = {
  start: Date;
  end: Date;
};

export type FrequencySubset = {
  factor?: number;
  start?: string;
  type: FrequencyType;
};
