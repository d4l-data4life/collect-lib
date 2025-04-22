import { ProgramEligibilityStep } from '../types';

export const isScoreEligible = (step: ProgramEligibilityStep, score?: number): boolean => {
  const thresholdValue = step.threshold.value;
  switch (step.threshold.operator) {
    case 'exists':
      return !!score;
    case 'eq':
      return score === thresholdValue;
    case 'neq':
      return score !== thresholdValue;
    case 'gt':
      return score! > thresholdValue;
    case 'lt':
      return score! < thresholdValue;
    case 'gteq':
      return score! >= thresholdValue;
    case 'lteq':
      return score! <= thresholdValue;
    default:
      return false;
  }
};
