import {
  ENABLE_WHEN_CONFORMANCE_CASES,
  OUT_OF_SUBSET_EXPRESSIONS,
  referencedVariables,
} from '../enable-when-expression';

// Engine-free checks: these guard the shape and internal consistency of the shared fixture.
// Actual evaluation of the expressions is asserted by phoenix (and studio validation) against
// this same fixture, once the evaluator/validator exist.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

describe('referencedVariables', () => {
  it('extracts distinct %variables', () => {
    expect(referencedVariables("%smoker = 'yes' and %gender.exists() and %gender != 'male'")).toEqual([
      'smoker',
      'gender',
    ]);
  });

  it('returns empty for an expression with no variables', () => {
    expect(referencedVariables('today() > today()')).toEqual([]);
  });
});

describe('ENABLE_WHEN_CONFORMANCE_CASES', () => {
  it('is non-empty', () => {
    expect(ENABLE_WHEN_CONFORMANCE_CASES.length).toBeGreaterThan(0);
  });

  it.each(ENABLE_WHEN_CONFORMANCE_CASES)('$description', (testCase) => {
    // every %variable used by the expression is provided in the environment
    for (const name of referencedVariables(testCase.expression)) {
      expect(testCase.variables).toHaveProperty(name);
    }
    // the pinned clock is an ISO date
    expect(testCase.now).toMatch(ISO_DATE);
    // expected is an actual boolean (not undefined/truthy)
    expect(typeof testCase.expected).toBe('boolean');
    // variable values are string arrays
    for (const value of Object.values(testCase.variables)) {
      expect(Array.isArray(value)).toBe(true);
      value.forEach((v) => expect(typeof v).toBe('string'));
    }
  });
});

describe('OUT_OF_SUBSET_EXPRESSIONS', () => {
  it('is non-empty and all entries are non-empty strings', () => {
    expect(OUT_OF_SUBSET_EXPRESSIONS.length).toBeGreaterThan(0);
    OUT_OF_SUBSET_EXPRESSIONS.forEach((expr) => {
      expect(typeof expr).toBe('string');
      expect(expr.length).toBeGreaterThan(0);
    });
  });
});
