/**
 * Cross-questionnaire `enableWhen`: the supported FHIRPath subset and a shared
 * conformance fixture.
 *
 * A cross-questionnaire or derived gate is expressed as an SDC `enableWhenExpression`
 * (text/fhirpath) over named variables (see `questionnaire-item-variable` in constants.ts).
 * To keep the feature testable and the authoring UI able to compile to it, phoenix only
 * evaluates and next-research-studio only emits the closed subset declared here.
 *
 * This module is intentionally engine-free: it defines the subset and the fixture as data.
 * The evaluator lives in `enable-when-eval.ts` (exposed via the `./fhirpath`
 * subpath) and must satisfy `ENABLE_WHEN_CONFORMANCE_CASES`; studio's validator must accept every
 * in-subset expression and reject every `OUT_OF_SUBSET_EXPRESSIONS` entry. Keeping both repos
 * pinned to this one fixture is the guard against subset drift.
 */

/** Boolean and comparison operators, plus collection union, allowed in a gate expression. */
export const SUPPORTED_FHIRPATH_OPERATORS = [
  'and',
  'or',
  '=',
  '!=',
  '>',
  '<',
  '>=',
  '<=',
  '|',
] as const;

/** Functions allowed in a gate expression. `today`/`now` read the injected clock. */
export const SUPPORTED_FHIRPATH_FUNCTIONS = [
  'exists',
  'empty',
  'not',
  'first',
  'contains',
  'today',
  'now',
  'toDate', // convert a string variable to a Date before date arithmetic (%d.toDate() + 18 years)
] as const;

/** Calendar units allowed in date arithmetic (`%d + 18 years`). */
export const SUPPORTED_FHIRPATH_DATE_UNITS = ['years', 'months', 'weeks', 'days'] as const;

/**
 * The variable environment a gate expression is evaluated against. Each variable resolves to a
 * collection of scalar strings: topic values, ISO date strings, or codes. An empty array means
 * the variable is unbound/absent (an empty FHIRPath collection).
 */
export type FhirPathVariables = Record<string, string[]>;

/**
 * A single conformance case: an expression, the environment and (fixed) clock it is evaluated
 * against, and the expected gate result. Shared verbatim between studio and phoenix so both sides
 * agree on the supported subset and its semantics. The clock is pinned for determinism.
 */
export type EnableWhenConformanceCase = {
  description: string;
  expression: string;
  variables: FhirPathVariables;
  /** Fixed value for `today()`/`now()`, ISO date (YYYY-MM-DD). */
  now: string;
  expected: boolean;
};

/** Extract the `%name` variables referenced by an expression (used by the fixture self-check). */
export const referencedVariables = (expression: string): string[] => {
  const names = new Set<string>();
  const re = /%([A-Za-z_][A-Za-z0-9_]*)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(expression)) !== null) {
    names.add(match[1]);
  }
  return Array.from(names);
};

/** Canonical cases covering the supported subset. Every expression here is in-subset. */
export const ENABLE_WHEN_CONFORMANCE_CASES: EnableWhenConformanceCase[] = [
  // cross-questionnaire equality: shown when gender known and not male.
  {
    description: 'equality: gender present and not male -> shown',
    expression: "%gender.exists() and %gender != 'male'",
    variables: { gender: ['female'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'equality: gender is male -> hidden',
    expression: "%gender.exists() and %gender != 'male'",
    variables: { gender: ['male'] },
    now: '2026-08-31',
    expected: false,
  },
  {
    description: 'equality: gender unknown (empty) -> hidden until known',
    expression: "%gender.exists() and %gender != 'male'",
    variables: { gender: [] },
    now: '2026-08-31',
    expected: false,
  },
  // age band (derived vs now).
  {
    description: 'age band: 26 year old -> shown (>= 18)',
    expression: '%birthDate.exists() and today() > %birthDate.toDate() + 18 years',
    variables: { birthDate: ['2000-01-01'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'age band: 11 year old -> hidden (< 18)',
    expression: '%birthDate.exists() and today() > %birthDate.toDate() + 18 years',
    variables: { birthDate: ['2015-01-01'] },
    now: '2026-08-31',
    expected: false,
  },
  // elapsed time since a date.
  {
    description: 'elapsed: enrolled 7 months ago -> shown (> 30 days)',
    expression: '%enrolledAt.exists() and %enrolledAt.toDate() + 30 days < today()',
    variables: { enrolledAt: ['2026-01-01'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'elapsed: enrolled 11 days ago -> hidden (<= 30 days)',
    expression: '%enrolledAt.exists() and %enrolledAt.toDate() + 30 days < today()',
    variables: { enrolledAt: ['2026-08-20'] },
    now: '2026-08-31',
    expected: false,
  },
  // mixed local + topic.
  {
    description: 'mixed: smoker yes and gender not male -> shown',
    expression: "%smoker = 'yes' and %gender.exists() and %gender != 'male'",
    variables: { smoker: ['yes'], gender: ['female'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'mixed: smoker no -> hidden',
    expression: "%smoker = 'yes' and %gender.exists() and %gender != 'male'",
    variables: { smoker: ['no'], gender: ['female'] },
    now: '2026-08-31',
    expected: false,
  },
  // not-answered (empty) gate.
  {
    description: 'empty gate: topic empty -> shown',
    expression: '%gender.empty()',
    variables: { gender: [] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'empty gate: topic has a value -> hidden',
    expression: '%gender.empty()',
    variables: { gender: ['female'] },
    now: '2026-08-31',
    expected: false,
  },
  // self-healing DOB: single topic variable, defensive .first() before date arithmetic.
  {
    description: 'first(): multi-value topic, adult -> shown',
    expression: '%birthDate.exists() and today() > %birthDate.first().toDate() + 18 years',
    variables: { birthDate: ['2000-01-01'] },
    now: '2026-08-31',
    expected: true,
  },
];

/**
 * Expressions outside the supported subset. Studio's validator must reject these; they are here so
 * that rejection is tested against the same list phoenix refuses to evaluate. Not exhaustive.
 */
export const OUT_OF_SUBSET_EXPRESSIONS: string[] = [
  "%gender.where($this = 'male').exists()", // where() not supported
  'iif(%gender.exists(), true, false)', // iif() not supported
  '%gender.count() > 0', // count() not supported
  "%name.substring(0, 2) = 'ab'", // substring() not supported
  "%code.matches('^[0-9]+$')", // matches() not supported
];
