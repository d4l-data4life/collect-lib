import { evaluateEnableWhen } from '../enable-when-eval';
import { ENABLE_WHEN_CONFORMANCE_CASES } from '../enable-when-expression';

// Runs the shared conformance fixture through the fhirpath.js-backed evaluator. The clock is
// pinned per case with fake timers so date-relative cases (age, elapsed) are deterministic.

describe('evaluateEnableWhen (fhirpath.js)', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it.each(ENABLE_WHEN_CONFORMANCE_CASES)('$description', (testCase) => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(`${testCase.now}T12:00:00Z`));
    expect(evaluateEnableWhen(testCase.expression, testCase.variables)).toBe(testCase.expected);
  });
});

// Proves fake timers actually drive fhirpath.js `today()` (module-level clock, read per
// evaluation), using times far from the real clock so a stale/real clock would flip the result.
describe('clock injection', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  const expr = '%d.toDate() + 30 days < today()';

  it('reads a faked far-future clock', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2040-06-01T12:00:00Z'));
    // 2040-01-01 + 30 days = 2040-01-31, which is < 2040-06-01 -> true (only if clock is 2040)
    expect(evaluateEnableWhen(expr, { d: ['2040-01-01'] })).toBe(true);
  });

  it('reads a different faked past clock on the next evaluation (not stale-cached)', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2000-06-01T12:00:00Z'));
    // same input, clock now 2000: 2040-01-31 < 2000-06-01 -> false
    expect(evaluateEnableWhen(expr, { d: ['2040-01-01'] })).toBe(false);
  });
});
