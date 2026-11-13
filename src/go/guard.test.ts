import { readFileSync } from 'fs';
import { join } from 'path';
import { StepCondition } from '../types';
import { StepParams, stepFulfillmentDate } from './guard';

// Shared with pkg/guard/guard_test.go, so Go is checked against the same expectations.
// Dates avoid DST changes, so the results don't depend on the machine's time zone.
const fixture: {
  params: StepParams;
  cases: { name: string; condition: StepCondition; expected: string | null }[];
} = JSON.parse(readFileSync(join(__dirname, 'fixtures/step-fulfillment.json'), 'utf8'));

describe('stepFulfillmentDate (Go entry for pkg/guard)', () => {
  it.each(fixture.cases)('$name', ({ condition, expected }) => {
    expect(stepFulfillmentDate(condition, fixture.params)).toBe(expected);
  });

  it('throws on a malformed condition', () => {
    expect(() => stepFulfillmentDate({ type: 'and' } as unknown as StepCondition, fixture.params)).toThrow();
  });
});
