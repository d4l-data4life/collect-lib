/**
 * Structured enableWhen conditions and their compilation to (and from) an `enableWhenExpression`.
 *
 * Research Studio authors a dependency as a flat list of {@link EnableWhenCondition} rows combined with one
 * {@link EnableWhenBehavior} (all / any), the same mental model as native `enableWhen` +
 * `enableBehavior`. `compileEnableWhen` turns those rows into the two proto/FHIR artifacts (variable
 * bindings and one FHIRPath expression in the subset declared in `enable-when-expression.ts`);
 * `decompileEnableWhen` reads them back so the editor can reopen a saved dependency as rows. The compiler is
 * the only producer of FHIRPath in the system, so its output shapes are the canonical forms the
 * decompiler and the conformance fixture are written against.
 *
 * Engine-free on purpose: studio imports this from the barrel; evaluation lives behind the
 * `./fhirpath` subpath.
 */
import { SUPPORTED_FHIRPATH_DATE_UNITS } from './enable-when-expression';
import { TopicScopeCode } from './topic-id';

/** Calendar unit for elapsed-time predicates; the subset's date units. */
export type EnableWhenDateUnit = (typeof SUPPORTED_FHIRPATH_DATE_UNITS)[number];

/**
 * How a source's values are typed, derived by studio from the producing question's input type
 * (coding: single/multi select, likert, country; integer: integer, ordinal scale; decimal: decimal,
 * numeric scale; date; year; string: everything else). It selects the allowed predicates and the
 * conversion the compiled expression applies.
 */
export type EnableWhenValueType = 'coding' | 'string' | 'integer' | 'decimal' | 'date' | 'year';

/** Where a condition reads its value from: a question in the same questionnaire, or a topic. */
export type EnableWhenSource =
  | { kind: 'question'; linkId: string }
  | { kind: 'topic'; topic: string; scope: TopicScopeCode };

export type EnableWhenComparisonOp = 'eq' | 'neq' | 'gt' | 'lt' | 'gteq' | 'lteq';

export type EnableWhenPredicate =
  | { op: 'exists' }
  | { op: 'empty' }
  /** `value` is a code/text for coding/string sources, a number for integer/decimal, an ISO date (`YYYY-MM-DD`) or year (`YYYY`) for date/year. */
  | { op: EnableWhenComparisonOp; value: string | number }
  | { op: 'oneOf'; values: string[] }
  /**
   * Elapsed time since the date, measured against today. `elapsedAtLeast` is inclusive ("age >= 18"
   * is `{ amount: 18, unit: 'years' }`, shown on the 18th birthday); `elapsedLessThan` is exclusive
   * ("age <= 17" is `{ amount: 18, unit: 'years' }`; "within the last 30 days" is `{ amount: 31,
   * unit: 'days' }`). The two are exact complements, so one boundary day never belongs to both or
   * to neither. What the date *means* (a birth date, an enrollment) is a UI concern, not a model one.
   */
  | { op: 'elapsedAtLeast'; amount: number; unit: EnableWhenDateUnit }
  | { op: 'elapsedLessThan'; amount: number; unit: EnableWhenDateUnit }
  /** `min` inclusive, `max` exclusive: "age 18 to 65" is `{ min: 18, max: 66, unit: 'years' }`. */
  | { op: 'elapsedBetween'; min: number; max: number; unit: EnableWhenDateUnit };

export type EnableWhenPredicateOp = EnableWhenPredicate['op'];

export type EnableWhenCondition = {
  source: EnableWhenSource;
  valueType: EnableWhenValueType;
  predicate: EnableWhenPredicate;
};

/** Mirrors `enableBehavior`: `all` = every row must hold (and), `any` = at least one (or). */
export type EnableWhenBehavior = 'all' | 'any';

/** Predicates that compare against the clock; they can never be expressed as native `enableWhen`. */
export const TEMPORAL_PREDICATES = ['elapsedAtLeast', 'elapsedLessThan', 'elapsedBetween'] as const;

/** Units an elapsed-time predicate may use per source type: a year-only date has no finer resolution. */
export const ELAPSED_UNITS_BY_VALUE_TYPE: Partial<
  Record<EnableWhenValueType, readonly EnableWhenDateUnit[]>
> = {
  date: SUPPORTED_FHIRPATH_DATE_UNITS,
  year: ['years'],
};

const COMPARISONS: readonly EnableWhenPredicateOp[] = [
  'exists',
  'empty',
  'eq',
  'neq',
  'gt',
  'lt',
  'gteq',
  'lteq',
];

/** Which predicates a source of a given value type supports; studio derives its operator options from this. */
export const ENABLE_WHEN_PREDICATES_BY_VALUE_TYPE: Record<
  EnableWhenValueType,
  readonly EnableWhenPredicateOp[]
> = {
  coding: ['exists', 'empty', 'eq', 'neq', 'oneOf'],
  string: ['exists', 'empty', 'eq', 'neq'],
  integer: COMPARISONS,
  decimal: COMPARISONS,
  date: [...COMPARISONS, ...TEMPORAL_PREDICATES],
  year: [...COMPARISONS, ...TEMPORAL_PREDICATES],
};

/**
 * True if the rows cannot be carried as native `enableWhen` and must be compiled to an expression:
 * any topic source, any clock-relative predicate, or a predicate native `enableWhen` has no
 * operator for (`empty`, `oneOf`).
 */
export const requiresExpression = (conditions: EnableWhenCondition[]): boolean =>
  conditions.some(
    (c) =>
      c.source.kind === 'topic' ||
      (TEMPORAL_PREDICATES as readonly string[]).includes(c.predicate.op) ||
      c.predicate.op === 'empty' ||
      c.predicate.op === 'oneOf'
  );

/** One variable binding; mirrors proto `ItemVariable` / the `questionnaire-item-variable` extension. `topic` is the bare topic id. */
export type EnableWhenItemVariable = {
  name: string;
  question?: string;
  topic?: string;
  scope?: TopicScopeCode;
};

export type CompiledEnableWhen = {
  itemVariables: EnableWhenItemVariable[];
  expression: string;
};

export class EnableWhenCompileError extends Error {
  constructor(
    message: string,
    public readonly conditionIndex?: number
  ) {
    super(message);
    this.name = 'EnableWhenCompileError';
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_YEAR = /^\d{4}$/;

const COMPARISON_SYMBOL: Record<EnableWhenComparisonOp, string> = {
  eq: '=',
  neq: '!=',
  gt: '>',
  lt: '<',
  gteq: '>=',
  lteq: '<=',
};

const SYMBOL_COMPARISON: Record<string, EnableWhenComparisonOp> = Object.fromEntries(
  Object.entries(COMPARISON_SYMBOL).map(([op, symbol]) => [symbol, op])
) as Record<string, EnableWhenComparisonOp>;

const CONVERSION: Record<Exclude<EnableWhenValueType, 'coding' | 'string'>, string> = {
  integer: 'toInteger',
  decimal: 'toDecimal',
  date: 'toDate',
  year: 'toDate',
};

const escapeString = (value: string): string =>
  `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const unescapeString = (literal: string): string =>
  literal.slice(1, -1).replace(/\\(['\\])/g, '$1');

const sourceKey = (source: EnableWhenSource): string =>
  source.kind === 'question' ? `q:${source.linkId}` : `t:${source.topic}:${source.scope}`;

/** Identifier-safe variable name for a source; topics are identifier-safe by construction, linkIds may not be. */
const baseVariableName = (source: EnableWhenSource): string => {
  const raw = source.kind === 'question' ? source.linkId : source.topic;
  const cleaned = raw.replace(/[^A-Za-z0-9_]/g, '_');
  return /^[A-Za-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
};

const assertElapsedUnit = (
  valueType: EnableWhenValueType,
  unit: EnableWhenDateUnit,
  index: number
): void => {
  if (!ELAPSED_UNITS_BY_VALUE_TYPE[valueType]?.includes(unit)) {
    throw new EnableWhenCompileError(
      `unit ${unit} is not supported for a ${valueType} source`,
      index
    );
  }
};

const assertNonNegativeInteger = (n: number, what: string, index: number): void => {
  if (!Number.isInteger(n) || n < 0) {
    throw new EnableWhenCompileError(`${what} must be a non-negative integer, got ${n}`, index);
  }
};

const formatLiteral = (
  valueType: EnableWhenValueType,
  value: string | number,
  index: number
): string => {
  switch (valueType) {
    case 'coding':
    case 'string':
      if (typeof value !== 'string') {
        throw new EnableWhenCompileError(`a ${valueType} value must be a string`, index);
      }
      return escapeString(value);
    case 'integer':
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        throw new EnableWhenCompileError('an integer value must be a whole number', index);
      }
      return String(value);
    case 'decimal':
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new EnableWhenCompileError('a decimal value must be a finite number', index);
      }
      return String(value);
    case 'date':
      if (typeof value !== 'string' || !ISO_DATE.test(value)) {
        throw new EnableWhenCompileError('a date value must be YYYY-MM-DD', index);
      }
      return `@${value}`;
    case 'year':
      if (typeof value !== 'string' || !ISO_YEAR.test(value)) {
        throw new EnableWhenCompileError('a year value must be YYYY', index);
      }
      return `@${value}`;
  }
};

/** Compile one row. `v` is the `%variable` reference. Shapes here are the canonical forms `decompileEnableWhen` recognizes. */
const compileCondition = (condition: EnableWhenCondition, v: string, index: number): string => {
  const { valueType, predicate } = condition;
  if (!ENABLE_WHEN_PREDICATES_BY_VALUE_TYPE[valueType].includes(predicate.op)) {
    throw new EnableWhenCompileError(
      `predicate ${predicate.op} is not supported for a ${valueType} source`,
      index
    );
  }
  const date = `${v}.first().toDate()`;

  switch (predicate.op) {
    case 'exists':
      return `${v}.exists()`;
    case 'empty':
      return `${v}.empty()`;
    case 'oneOf':
      if (predicate.values.length === 0) {
        throw new EnableWhenCompileError('oneOf needs at least one value', index);
      }
      return predicate.values
        .map((value) => `${v} contains ${formatLiteral('coding', value, index)}`)
        .join(' or ');
    case 'elapsedAtLeast':
      assertElapsedUnit(valueType, predicate.unit, index);
      assertNonNegativeInteger(predicate.amount, 'amount', index);
      return `${v}.exists() and today() >= ${date} + ${predicate.amount} ${predicate.unit}`;
    case 'elapsedLessThan':
      assertElapsedUnit(valueType, predicate.unit, index);
      assertNonNegativeInteger(predicate.amount, 'amount', index);
      return `${v}.exists() and today() < ${date} + ${predicate.amount} ${predicate.unit}`;
    case 'elapsedBetween':
      assertElapsedUnit(valueType, predicate.unit, index);
      assertNonNegativeInteger(predicate.min, 'min', index);
      assertNonNegativeInteger(predicate.max, 'max', index);
      if (predicate.max <= predicate.min) {
        throw new EnableWhenCompileError('max must be greater than min (max is exclusive)', index);
      }
      return `${v}.exists() and today() >= ${date} + ${predicate.min} ${predicate.unit} and today() < ${date} + ${predicate.max} ${predicate.unit}`;
  }

  const literal = formatLiteral(valueType, predicate.value, index);
  const symbol = COMPARISON_SYMBOL[predicate.op];

  // Coding equality is membership, so a multi-value source (scope `all`, multi_select) matches if any
  // held value does. Other types compare the first value after conversion. `neq` is guarded with
  // exists() so an unknown value stays hidden rather than trivially "not equal".
  if (valueType === 'coding') {
    return predicate.op === 'eq'
      ? `${v} contains ${literal}`
      : `${v}.exists() and (${v} contains ${literal}).not()`;
  }
  const converted =
    valueType === 'string' ? `${v}.first()` : `${v}.first().${CONVERSION[valueType]}()`;
  return predicate.op === 'neq'
    ? `${v}.exists() and ${converted} != ${literal}`
    : `${converted} ${symbol} ${literal}`;
};

/**
 * Compile rows + behavior into variable bindings and one FHIRPath expression. Sources used by
 * several rows share one variable. Throws {@link EnableWhenCompileError} on an invalid row; studio only
 * compiles rows that passed its own validation, so a throw is a programming error there.
 */
export const compileEnableWhen = (
  conditions: EnableWhenCondition[],
  behavior: EnableWhenBehavior
): CompiledEnableWhen => {
  if (conditions.length === 0) {
    throw new EnableWhenCompileError('an enableWhen needs at least one condition');
  }

  const variablesBySource = new Map<string, EnableWhenItemVariable>();
  const usedNames = new Set<string>();

  const variableFor = (source: EnableWhenSource): string => {
    const key = sourceKey(source);
    const existing = variablesBySource.get(key);
    if (existing) {
      return existing.name;
    }
    const base = baseVariableName(source);
    let name = base;
    for (let i = 2; usedNames.has(name); i++) {
      name = `${base}_${i}`;
    }
    usedNames.add(name);
    const variable: EnableWhenItemVariable =
      source.kind === 'question'
        ? { name, question: source.linkId }
        : { name, topic: source.topic, scope: source.scope };
    variablesBySource.set(key, variable);
    return name;
  };

  const rows = conditions.map((condition, index) =>
    compileCondition(condition, `%${variableFor(condition.source)}`, index)
  );
  const expression =
    rows.length === 1
      ? rows[0]
      : rows.map((row) => `(${row})`).join(behavior === 'all' ? ' and ' : ' or ');

  return { itemVariables: Array.from(variablesBySource.values()), expression };
};

export type DecompiledEnableWhen = {
  conditions: EnableWhenCondition[];
  behavior: EnableWhenBehavior;
};

const V = '%([A-Za-z_][A-Za-z0-9_]*)';
const STR = "('(?:\\\\.|[^'\\\\])*')";
const NUM = '(-?\\d+(?:\\.\\d+)?)';
const DATE = '(@\\d{4}(?:-\\d{2}-\\d{2})?)';
const LIT = `(?:${STR}|${NUM}|${DATE})`;
const CMP = '(=|!=|<=|>=|<|>)';
const CONV = '(toInteger|toDecimal|toDate)';
const INT = '(\\d+)';

const rx = (pattern: string): RegExp => new RegExp(`^${pattern}$`);

const ROW_EXISTS = rx(`${V}\\.exists\\(\\)`);
const ROW_EMPTY = rx(`${V}\\.empty\\(\\)`);
const ROW_CONTAINS = rx(`${V} contains ${STR}`);
const ROW_NOT_CONTAINS = rx(`${V}\\.exists\\(\\) and \\(${V} contains ${STR}\\)\\.not\\(\\)`);
const ROW_STRING_EQ = rx(`${V}\\.first\\(\\) = ${STR}`);
const ROW_STRING_NEQ = rx(`${V}\\.exists\\(\\) and ${V}\\.first\\(\\) != ${STR}`);
const ROW_CONVERTED_CMP = rx(`${V}\\.first\\(\\)\\.${CONV}\\(\\) ${CMP} ${LIT}`);
const ROW_CONVERTED_NEQ = rx(
  `${V}\\.exists\\(\\) and ${V}\\.first\\(\\)\\.${CONV}\\(\\) != ${LIT}`
);
const UNIT = `(${SUPPORTED_FHIRPATH_DATE_UNITS.join('|')})`;
const ELAPSED = `${V}\\.first\\(\\)\\.toDate\\(\\) \\+ ${INT} ${UNIT}`;
const ROW_ELAPSED_AT_LEAST = rx(`${V}\\.exists\\(\\) and today\\(\\) >= ${ELAPSED}`);
const ROW_ELAPSED_LESS_THAN = rx(`${V}\\.exists\\(\\) and today\\(\\) < ${ELAPSED}`);
const ROW_ELAPSED_BETWEEN = rx(
  `${V}\\.exists\\(\\) and today\\(\\) >= ${ELAPSED} and today\\(\\) < ${ELAPSED}`
);

type ParsedRow = {
  variable: string;
  valueType?: EnableWhenValueType;
  predicate: EnableWhenPredicate;
};

const literalValue = (
  str?: string,
  num?: string,
  date?: string
): { value: string | number; valueType?: EnableWhenValueType } => {
  if (str !== undefined) return { value: unescapeString(str), valueType: 'string' };
  if (num !== undefined) return { value: Number(num) };
  return {
    value: (date as string).slice(1),
    valueType: (date as string).length === 5 ? 'year' : 'date',
  };
};

const convertedValueType = (
  conv: string,
  literalType?: EnableWhenValueType
): EnableWhenValueType =>
  conv === 'toInteger' ? 'integer' : conv === 'toDecimal' ? 'decimal' : (literalType ?? 'date');

const sameVariable = (...names: string[]): boolean => names.every((n) => n === names[0]);

/** Recognize one canonical row shape. */
const parseRow = (row: string): ParsedRow | null => {
  let m: RegExpMatchArray | null;

  if ((m = row.match(ROW_EXISTS))) return { variable: m[1], predicate: { op: 'exists' } };
  if ((m = row.match(ROW_EMPTY))) return { variable: m[1], predicate: { op: 'empty' } };
  if ((m = row.match(ROW_NOT_CONTAINS)) && sameVariable(m[1], m[2])) {
    return {
      variable: m[1],
      valueType: 'coding',
      predicate: { op: 'neq', value: unescapeString(m[3]) },
    };
  }
  if ((m = row.match(ROW_STRING_EQ))) {
    return {
      variable: m[1],
      valueType: 'string',
      predicate: { op: 'eq', value: unescapeString(m[2]) },
    };
  }
  if ((m = row.match(ROW_STRING_NEQ)) && sameVariable(m[1], m[2])) {
    return {
      variable: m[1],
      valueType: 'string',
      predicate: { op: 'neq', value: unescapeString(m[3]) },
    };
  }
  if ((m = row.match(ROW_CONVERTED_CMP))) {
    const lit = literalValue(m[4], m[5], m[6]);
    if (lit.valueType === 'string') return null;
    return {
      variable: m[1],
      valueType: convertedValueType(m[2], lit.valueType),
      predicate: { op: SYMBOL_COMPARISON[m[3]], value: lit.value },
    };
  }
  if ((m = row.match(ROW_CONVERTED_NEQ)) && sameVariable(m[1], m[2])) {
    const lit = literalValue(m[4], m[5], m[6]);
    if (lit.valueType === 'string') return null;
    return {
      variable: m[1],
      valueType: convertedValueType(m[3], lit.valueType),
      predicate: { op: 'neq', value: lit.value },
    };
  }
  // groups: 1 guard var, 2 var, 3 amount, 4 unit (, 5 var, 6 amount, 7 unit for between)
  if ((m = row.match(ROW_ELAPSED_BETWEEN)) && sameVariable(m[1], m[2], m[5]) && m[4] === m[7]) {
    return {
      variable: m[1],
      valueType: 'date',
      predicate: {
        op: 'elapsedBetween',
        min: Number(m[3]),
        max: Number(m[6]),
        unit: m[4] as EnableWhenDateUnit,
      },
    };
  }
  if ((m = row.match(ROW_ELAPSED_AT_LEAST)) && sameVariable(m[1], m[2])) {
    return {
      variable: m[1],
      valueType: 'date',
      predicate: { op: 'elapsedAtLeast', amount: Number(m[3]), unit: m[4] as EnableWhenDateUnit },
    };
  }
  if ((m = row.match(ROW_ELAPSED_LESS_THAN)) && sameVariable(m[1], m[2])) {
    return {
      variable: m[1],
      valueType: 'date',
      predicate: { op: 'elapsedLessThan', amount: Number(m[3]), unit: m[4] as EnableWhenDateUnit },
    };
  }

  // `contains` alone or or-joined over the same variable: eq (one value) or oneOf (several).
  const parts = splitTopLevel(row);
  if (parts && parts.connector === 'or') {
    const matches = parts.segments.map((s) => s.match(ROW_CONTAINS));
    if (
      matches.every((x): x is RegExpMatchArray => x !== null) &&
      sameVariable(...matches.map((x) => x[1]))
    ) {
      return {
        variable: matches[0][1],
        valueType: 'coding',
        predicate: { op: 'oneOf', values: matches.map((x) => unescapeString(x[2])) },
      };
    }
  }
  if ((m = row.match(ROW_CONTAINS))) {
    return {
      variable: m[1],
      valueType: 'coding',
      predicate: { op: 'eq', value: unescapeString(m[2]) },
    };
  }

  return null;
};

/** Collapse whitespace runs outside string literals and trim. */
const normalize = (expression: string): string =>
  expression
    .split(/('(?:\\.|[^'\\])*')/)
    .map((part, i) => (i % 2 === 1 ? part : part.replace(/\s+/g, ' ')))
    .join('')
    .trim();

/** Strip one pair of parentheses if it encloses the whole string. */
const unwrap = (s: string): string => {
  if (!s.startsWith('(') || !s.endsWith(')')) return s;
  let depth = 0;
  let inString = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (ch === '\\') i++;
      else if (ch === "'") inString = false;
      continue;
    }
    if (ch === "'") inString = true;
    else if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0 && i < s.length - 1) return s; // the opening paren closes before the end
    }
  }
  return s.slice(1, -1).trim();
};

/** Split at depth-0 ` and ` / ` or ` outside strings. Null if none found or connectors are mixed. */
const splitTopLevel = (s: string): { connector: 'and' | 'or'; segments: string[] } | null => {
  const segments: string[] = [];
  let connector: 'and' | 'or' | null = null;
  let depth = 0;
  let inString = false;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (ch === '\\') i++;
      else if (ch === "'") inString = false;
      continue;
    }
    if (ch === "'") inString = true;
    else if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (depth === 0 && ch === ' ') {
      const found = s.startsWith(' and ', i) ? 'and' : s.startsWith(' or ', i) ? 'or' : null;
      if (found) {
        if (connector && connector !== found) return null;
        connector = found;
        segments.push(s.slice(start, i).trim());
        i += found.length + 1;
        start = i + 1;
      }
    }
  }
  if (!connector) return null;
  segments.push(s.slice(start).trim());
  return { connector, segments };
};

/**
 * Read compiled artifacts back into rows. Returns null when the expression is not in the compiler's
 * canonical shapes (hand-written or imported FHIRPath), which the editor shows as a read-only
 * custom expression. The value type of a row is inferred from the expression where the shape
 * reveals it; pass `resolveValueType` (looked up from the actual source) to make it authoritative,
 * since e.g. an age row cannot tell a `date` from a `year` source and `exists` rows carry no type.
 */
export const decompileEnableWhen = (
  itemVariables: EnableWhenItemVariable[],
  expression: string,
  resolveValueType?: (source: EnableWhenSource) => EnableWhenValueType | undefined
): DecompiledEnableWhen | null => {
  const sources = new Map<string, EnableWhenSource>();
  for (const variable of itemVariables) {
    if (variable.question !== undefined && variable.topic === undefined) {
      sources.set(variable.name, { kind: 'question', linkId: variable.question });
    } else if (variable.topic !== undefined && variable.question === undefined) {
      sources.set(variable.name, {
        kind: 'topic',
        topic: variable.topic,
        scope: variable.scope ?? 'latest',
      });
    } else {
      return null;
    }
  }

  const normalized = unwrap(normalize(expression));
  let behavior: EnableWhenBehavior = 'all';
  let rows: ParsedRow[];

  const single = parseRow(normalized);
  if (single) {
    rows = [single];
  } else {
    const split = splitTopLevel(normalized);
    if (!split) return null;
    behavior = split.connector === 'and' ? 'all' : 'any';
    const parsed = split.segments.map((segment) => parseRow(unwrap(segment)));
    if (!parsed.every((r): r is ParsedRow => r !== null)) return null;
    rows = parsed;
  }

  const conditions: EnableWhenCondition[] = [];
  for (const row of rows) {
    const source = sources.get(row.variable);
    if (!source) return null;
    const valueType = resolveValueType?.(source) ?? row.valueType ?? 'string';
    if (!ENABLE_WHEN_PREDICATES_BY_VALUE_TYPE[valueType].includes(row.predicate.op)) return null;
    conditions.push({ source, valueType, predicate: row.predicate });
  }
  return { conditions, behavior };
};
