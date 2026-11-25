/**
 * Cross-questionnaire `enableWhen`: the supported FHIRPath subset, an engine-free subset validator,
 * and a shared conformance fixture.
 *
 * A cross-questionnaire or derived condition is expressed as an SDC `enableWhenExpression`
 * (text/fhirpath) over named variables (see `questionnaire-item-variable` in constants.ts).
 * To keep the feature testable and the authoring UI able to compile to it, phoenix only
 * evaluates and next-research-studio only emits the closed subset declared here. Studio never
 * writes FHIRPath by hand: it compiles structured conditions via `enable-when-conditions.ts`, whose
 * templates are the only producer of expressions.
 *
 * This module is intentionally engine-free: it defines the subset and the fixture as data.
 * The evaluator lives in `enable-when-eval.ts` (exposed via the `./fhirpath`
 * subpath) and must satisfy `ENABLE_WHEN_CONFORMANCE_CASES`; `findSubsetViolations` must accept
 * every in-subset expression and reject every `OUT_OF_SUBSET_EXPRESSIONS` entry. Keeping both
 * repos pinned to this one fixture is the guard against subset drift.
 */

/**
 * Boolean, comparison and membership operators, plus collection union, allowed in an enableWhen
 * expression. `contains` is the infix membership operator (`%coll contains 'x'`), not the string
 * function.
 */
export const SUPPORTED_FHIRPATH_OPERATORS = [
  'and',
  'or',
  'contains',
  '=',
  '!=',
  '>',
  '<',
  '>=',
  '<=',
  '|',
] as const;

/**
 * Functions allowed in an enableWhen expression. `today`/`now` read the ambient clock (device time in
 * production, pinned via fake timers in tests). Variable values always arrive as strings, so a
 * value must be converted before it can be compared to a number (`toInteger`/`toDecimal`) or used
 * in date arithmetic (`toDate`); comparing a raw string variable to a number is an evaluation
 * error, not a false.
 */
export const SUPPORTED_FHIRPATH_FUNCTIONS = [
  'exists',
  'empty',
  'not',
  'first',
  'today',
  'now',
  'toDate',
  'toInteger',
  'toDecimal',
] as const;

/** Calendar units allowed in date arithmetic (`%d.first().toDate() + 18 years`). */
export const SUPPORTED_FHIRPATH_DATE_UNITS = ['years', 'months', 'weeks', 'days'] as const;

/**
 * The variable environment an enableWhen expression is evaluated against. Each variable resolves to a
 * collection of scalar strings: codes, free text, numbers as decimal strings, or dates as
 * `YYYY-MM-DD` / `YYYY` (a dateTime string does not convert with `toDate()` and yields an empty
 * collection). An empty array means the variable is unbound/absent (an empty FHIRPath
 * collection). Every variable an expression references must be present as a key: fhirpath.js
 * throws on an undefined environment variable.
 */
export type FhirPathVariables = Record<string, string[]>;

/**
 * A single conformance case: an expression, the environment and (fixed) clock it is evaluated
 * against, and the expected result (shown or hidden). Shared verbatim between studio and phoenix so both sides
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

const STRING_LITERAL = /'(?:\\.|[^'\\])*'/g;
const DATE_LITERAL = /@\d{4}(?:-\d{2}(?:-\d{2})?)?/g;
const NUMBER_LITERAL = /\b\d+(?:\.\d+)?\b/g;
const VARIABLE = /%[A-Za-z_][A-Za-z0-9_]*/g;
const FUNCTION_CALL = /([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
const BARE_WORD = /[A-Za-z_][A-Za-z0-9_]*/g;
const ALLOWED_SYMBOLS = /^[\s().=!<>|+\-]*$/;

// A raw (unconverted) string variable next to a number or a calendar quantity: fhirpath.js throws
// on the type mismatch instead of returning empty, so treat it as out of subset up front.
const RAW_VARIABLE_VS_NUMBER =
  /%[A-Za-z_][A-Za-z0-9_]*(?:\.first\(\))?\s*(?:=|!=|<=|>=|<|>)\s*\d|\d\s*(?:=|!=|<=|>=|<|>)\s*%[A-Za-z_][A-Za-z0-9_]*(?:\.first\(\))?(?![.\w])/;
const RAW_VARIABLE_DATE_ARITHMETIC =
  /%[A-Za-z_][A-Za-z0-9_]*(?:\.first\(\))?\s*[+-]\s*\d+\s*(?:years|months|weeks|days)\b/;

const WORD_OPERATORS = new Set<string>(['and', 'or', 'contains']);
const DATE_UNITS = new Set<string>(SUPPORTED_FHIRPATH_DATE_UNITS);
const FUNCTIONS = new Set<string>(SUPPORTED_FHIRPATH_FUNCTIONS);
const BOOLEAN_LITERALS = new Set(['true', 'false']);

/**
 * Engine-free check that an expression stays inside the supported subset. Returns one human-readable
 * violation per offending token (empty array = in subset). It is a lexical check, not a parser: it
 * rejects unknown functions, unknown words (member access like `.code`, `$this`, `in`, `iif`),
 * and characters the subset never uses. Well-formedness is left to the evaluator.
 */
export const findSubsetViolations = (expression: string): string[] => {
  const violations: string[] = [];
  const withoutStrings = expression.replace(STRING_LITERAL, ' ');
  if (RAW_VARIABLE_VS_NUMBER.test(withoutStrings)) {
    violations.push(
      'a variable must be converted with toInteger()/toDecimal() before comparing it to a number'
    );
  }
  if (RAW_VARIABLE_DATE_ARITHMETIC.test(withoutStrings)) {
    violations.push('a variable must be converted with toDate() before date arithmetic');
  }
  let rest = withoutStrings.replace(DATE_LITERAL, ' ').replace(VARIABLE, ' ');

  rest = rest.replace(FUNCTION_CALL, (call, name: string) => {
    if (WORD_OPERATORS.has(name)) {
      return call; // `and (`, `or (`: a word operator before a parenthesized group, not a call
    }
    if (!FUNCTIONS.has(name)) {
      violations.push(`unsupported function: ${name}()`);
    }
    return ' (';
  });

  rest = rest.replace(BARE_WORD, (word) => {
    if (!WORD_OPERATORS.has(word) && !DATE_UNITS.has(word) && !BOOLEAN_LITERALS.has(word)) {
      violations.push(`unsupported token: ${word}`);
    }
    return ' ';
  });

  rest = rest.replace(NUMBER_LITERAL, ' ');

  if (!ALLOWED_SYMBOLS.test(rest)) {
    const offending = Array.from(new Set(rest.replace(/[\s().=!<>|+\-]/g, '').split('')));
    violations.push(`unsupported character(s): ${offending.join(' ')}`);
  }

  return violations;
};

/**
 * Canonical cases covering the supported subset. Every expression here is in-subset, and every
 * template in `enable-when-conditions.ts` has at least one case here in its compiled form.
 */
export const ENABLE_WHEN_CONFORMANCE_CASES: EnableWhenConformanceCase[] = [
  // existence
  {
    description: 'exists: topic has a value -> shown',
    expression: '%gender.exists()',
    variables: { gender: ['female'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'exists: topic empty -> hidden',
    expression: '%gender.exists()',
    variables: { gender: [] },
    now: '2026-08-31',
    expected: false,
  },
  {
    description: 'is not answered: topic empty -> shown',
    expression: '%gender.empty()',
    variables: { gender: [] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'is not answered: topic has a value -> hidden',
    expression: '%gender.empty()',
    variables: { gender: ['female'] },
    now: '2026-08-31',
    expected: false,
  },
  // coding equality is membership: any held value matches.
  {
    description: 'coding equals: single value matches -> shown',
    expression: "%gender contains 'female'",
    variables: { gender: ['female'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'coding equals: multi-value topic (scope all / multi_select) holds the code -> shown',
    expression: "%gender contains 'male'",
    variables: { gender: ['female', 'male'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'coding equals: empty -> hidden',
    expression: "%gender contains 'female'",
    variables: { gender: [] },
    now: '2026-08-31',
    expected: false,
  },
  {
    description: 'coding not equals: known and not male -> shown',
    expression: "%gender.exists() and (%gender contains 'male').not()",
    variables: { gender: ['female'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'coding not equals: multi-value topic holding male -> hidden',
    expression: "%gender.exists() and (%gender contains 'male').not()",
    variables: { gender: ['female', 'male'] },
    now: '2026-08-31',
    expected: false,
  },
  {
    description: 'coding not equals: unknown (empty) -> hidden until known',
    expression: "%gender.exists() and (%gender contains 'male').not()",
    variables: { gender: [] },
    now: '2026-08-31',
    expected: false,
  },
  {
    description: 'one of: gender is one of {female, diverse} -> shown',
    expression: "%gender contains 'female' or %gender contains 'diverse'",
    variables: { gender: ['diverse'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'one of: gender not in the set -> hidden',
    expression: "%gender contains 'female' or %gender contains 'diverse'",
    variables: { gender: ['male'] },
    now: '2026-08-31',
    expected: false,
  },
  // free-text equality on the first value (with escaped quote).
  {
    description: 'string equals: first value matches (escaped quote) -> shown',
    expression: "%city.first() = 'L\\'Aquila'",
    variables: { city: ["L'Aquila"] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'string not equals: unknown -> hidden',
    expression: "%city.exists() and %city.first() != 'Berlin'",
    variables: { city: [] },
    now: '2026-08-31',
    expected: false,
  },
  // numeric comparisons need an explicit conversion (values are strings).
  {
    description: 'integer greater than: 7 > 5 -> shown',
    expression: '%score.first().toInteger() > 5',
    variables: { score: ['7'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'integer at most: 5 <= 5 -> shown',
    expression: '%score.first().toInteger() <= 5',
    variables: { score: ['5'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'integer equals: empty -> hidden',
    expression: '%score.first().toInteger() = 5',
    variables: { score: [] },
    now: '2026-08-31',
    expected: false,
  },
  {
    description: 'decimal at least: 7.25 >= 5.5 -> shown',
    expression: '%weight.first().toDecimal() >= 5.5',
    variables: { weight: ['7.25'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'decimal less than: 7.25 < 5.5 -> hidden',
    expression: '%weight.first().toDecimal() < 5.5',
    variables: { weight: ['7.25'] },
    now: '2026-08-31',
    expected: false,
  },
  // date compared to a literal date.
  {
    description: 'date after literal: 2021-05-05 > 2020-01-01 -> shown',
    expression: '%visit.first().toDate() > @2020-01-01',
    variables: { visit: ['2021-05-05'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'year equals literal year -> shown',
    expression: '%born.first().toDate() = @1990',
    variables: { born: ['1990'] },
    now: '2026-08-31',
    expected: true,
  },
  // age at least (derived vs today; inclusive: shown on the Nth birthday).
  {
    description: 'age at least 18: 26 year old -> shown',
    expression: '%birthDate.exists() and today() >= %birthDate.first().toDate() + 18 years',
    variables: { birthDate: ['2000-01-01'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'age at least 18: on the 18th birthday -> shown',
    expression: '%birthDate.exists() and today() >= %birthDate.first().toDate() + 18 years',
    variables: { birthDate: ['2008-08-31'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'age at least 18: the day before the 18th birthday -> hidden',
    expression: '%birthDate.exists() and today() >= %birthDate.first().toDate() + 18 years',
    variables: { birthDate: ['2008-09-01'] },
    now: '2026-08-31',
    expected: false,
  },
  {
    description: 'age at least 18: 11 year old -> hidden',
    expression: '%birthDate.exists() and today() >= %birthDate.first().toDate() + 18 years',
    variables: { birthDate: ['2015-01-01'] },
    now: '2026-08-31',
    expected: false,
  },
  {
    description: 'age at least 18: unknown birth date -> hidden',
    expression: '%birthDate.exists() and today() >= %birthDate.first().toDate() + 18 years',
    variables: { birthDate: [] },
    now: '2026-08-31',
    expected: false,
  },
  // a year-only source is a year-precision date: decidable outside the boundary year, hidden within it.
  {
    description: 'age at least 18 from a birth year: 2000 -> shown',
    expression: '%birthYear.exists() and today() >= %birthYear.first().toDate() + 18 years',
    variables: { birthYear: ['2000'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'age at least 18 from a birth year: 2008 in 2026 is undecidable -> hidden',
    expression: '%birthYear.exists() and today() >= %birthYear.first().toDate() + 18 years',
    variables: { birthYear: ['2008'] },
    now: '2026-08-31',
    expected: false,
  },
  // elapsed less than N (exclusive), the complement of at-least: "age at most 17" = less than 18 years ago.
  {
    description: 'less than 18 years ago (age at most 17): 11 year old -> shown',
    expression: '%birthDate.exists() and today() < %birthDate.first().toDate() + 18 years',
    variables: { birthDate: ['2015-01-01'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'less than 18 years ago (age at most 17): on the 18th birthday -> hidden',
    expression: '%birthDate.exists() and today() < %birthDate.first().toDate() + 18 years',
    variables: { birthDate: ['2008-08-31'] },
    now: '2026-08-31',
    expected: false,
  },
  // age band: min <= age <= max, inclusive (upper bound uses max + 1 years).
  {
    description: 'age between 18..65: 36 year old -> shown',
    expression:
      '%birthDate.exists() and today() >= %birthDate.first().toDate() + 18 years and today() < %birthDate.first().toDate() + 66 years',
    variables: { birthDate: ['1990-01-01'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'age between 18..65: 11 year old -> hidden (below min)',
    expression:
      '%birthDate.exists() and today() >= %birthDate.first().toDate() + 18 years and today() < %birthDate.first().toDate() + 66 years',
    variables: { birthDate: ['2015-01-01'] },
    now: '2026-08-31',
    expected: false,
  },
  {
    description: 'age between 18..65: 70 year old -> hidden (above max)',
    expression:
      '%birthDate.exists() and today() >= %birthDate.first().toDate() + 18 years and today() < %birthDate.first().toDate() + 66 years',
    variables: { birthDate: ['1956-01-01'] },
    now: '2026-08-31',
    expected: false,
  },
  // elapsed time since a date.
  {
    description: 'at least 31 days ago (more than 30): enrolled 7 months ago -> shown',
    expression: '%enrolledAt.exists() and today() >= %enrolledAt.first().toDate() + 31 days',
    variables: { enrolledAt: ['2026-01-01'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'at least 31 days ago (more than 30): enrolled 11 days ago -> hidden',
    expression: '%enrolledAt.exists() and today() >= %enrolledAt.first().toDate() + 31 days',
    variables: { enrolledAt: ['2026-08-20'] },
    now: '2026-08-31',
    expected: false,
  },
  {
    description: 'less than 31 days ago (within the last 30): enrolled 11 days ago -> shown',
    expression: '%enrolledAt.exists() and today() < %enrolledAt.first().toDate() + 31 days',
    variables: { enrolledAt: ['2026-08-20'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'less than 31 days ago (within the last 30): enrolled 7 months ago -> hidden',
    expression: '%enrolledAt.exists() and today() < %enrolledAt.first().toDate() + 31 days',
    variables: { enrolledAt: ['2026-01-01'] },
    now: '2026-08-31',
    expected: false,
  },
  {
    description: 'months unit: at least 6 months ago -> shown',
    expression: '%enrolledAt.exists() and today() >= %enrolledAt.first().toDate() + 6 months',
    variables: { enrolledAt: ['2026-01-01'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'weeks unit: less than 2 weeks ago -> hidden when 11 weeks ago',
    expression: '%enrolledAt.exists() and today() < %enrolledAt.first().toDate() + 2 weeks',
    variables: { enrolledAt: ['2026-06-15'] },
    now: '2026-08-31',
    expected: false,
  },
  {
    description: 'now(): date is in the past -> shown',
    expression: 'now() > %visit.first().toDate()',
    variables: { visit: ['2020-01-01'] },
    now: '2026-08-31',
    expected: true,
  },
  // combining conditions: each condition parenthesized, one connector.
  {
    description: 'all of: local smoker yes and topic gender not male -> shown',
    expression: "(%smoker contains 'yes') and (%gender.exists() and (%gender contains 'male').not())",
    variables: { smoker: ['yes'], gender: ['female'] },
    now: '2026-08-31',
    expected: true,
  },
  {
    description: 'all of: local smoker no -> hidden',
    expression: "(%smoker contains 'yes') and (%gender.exists() and (%gender contains 'male').not())",
    variables: { smoker: ['no'], gender: ['female'] },
    now: '2026-08-31',
    expected: false,
  },
  {
    description: 'any of: adult or consented -> shown via second condition',
    expression:
      "(%birthDate.exists() and today() >= %birthDate.first().toDate() + 18 years) or (%consent contains 'yes')",
    variables: { birthDate: ['2015-01-01'], consent: ['yes'] },
    now: '2026-08-31',
    expected: true,
  },
  // union: any of several sources holds a value.
  {
    description: 'union: first source empty, second set -> shown',
    expression: '(%a | %b).exists()',
    variables: { a: [], b: ['x'] },
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
  "%gender in ('male' | 'female')", // `in` not supported, use `contains`
  "%coding.code = 'male'", // member access not supported: variables are scalar strings
  '%score > 5', // raw string compared to a number is an evaluation error: needs toInteger()/toDecimal()
  '%d.toDate() + 18 hours < today()', // sub-day units not supported
  '%score.first().toInteger() * 2 > 5', // arithmetic other than date +/- not supported
];
