import { evaluateEnableWhen } from '../enable-when-eval';
import { findSubsetViolations } from '../enable-when-expression';
import {
  ENABLE_WHEN_PREDICATES_BY_VALUE_TYPE,
  EnableWhenCompileError,
  EnableWhenCondition,
  EnableWhenSource,
  compileEnableWhen,
  decompileEnableWhen,
  requiresExpression,
} from '../enable-when-conditions';

const gender: EnableWhenSource = { kind: 'topic', topic: 'gender', scope: 'latest' };
const birthDate: EnableWhenSource = { kind: 'topic', topic: 'birthDate', scope: 'latest' };
const smoker: EnableWhenSource = { kind: 'question', linkId: 'smoker' };
const score: EnableWhenSource = { kind: 'question', linkId: 'q-1.score' };

const coding = (
  source: EnableWhenSource,
  predicate: EnableWhenCondition['predicate']
): EnableWhenCondition => ({
  source,
  valueType: 'coding',
  predicate,
});

describe('compileEnableWhen', () => {
  it('compiles the worked examples to their canonical expressions and bindings', () => {
    expect(compileEnableWhen([coding(gender, { op: 'neq', value: 'male' })], 'all')).toEqual({
      itemVariables: [{ name: 'gender', topic: 'gender', scope: 'latest' }],
      expression: "%gender.exists() and (%gender contains 'male').not()",
    });

    expect(
      compileEnableWhen(
        [
          {
            source: birthDate,
            valueType: 'date',
            predicate: { op: 'elapsedAtLeast', amount: 18, unit: 'years' },
          },
        ],
        'all'
      )
    ).toEqual({
      itemVariables: [{ name: 'birthDate', topic: 'birthDate', scope: 'latest' }],
      expression: '%birthDate.exists() and today() >= %birthDate.first().toDate() + 18 years',
    });

    expect(
      compileEnableWhen(
        [coding(smoker, { op: 'eq', value: 'yes' }), coding(gender, { op: 'neq', value: 'male' })],
        'all'
      )
    ).toEqual({
      itemVariables: [
        { name: 'smoker', question: 'smoker' },
        { name: 'gender', topic: 'gender', scope: 'latest' },
      ],
      expression:
        "(%smoker contains 'yes') and (%gender.exists() and (%gender contains 'male').not())",
    });

    expect(compileEnableWhen([coding(gender, { op: 'empty' })], 'all').expression).toBe(
      '%gender.empty()'
    );
  });

  it('joins rows with or for behavior any', () => {
    const { expression } = compileEnableWhen(
      [coding(smoker, { op: 'exists' }), coding(gender, { op: 'eq', value: 'female' })],
      'any'
    );
    expect(expression).toBe("(%smoker.exists()) or (%gender contains 'female')");
  });

  it('shares one variable between rows on the same source and sanitizes linkIds', () => {
    const { itemVariables, expression } = compileEnableWhen(
      [
        { source: score, valueType: 'integer', predicate: { op: 'gteq', value: 3 } },
        { source: score, valueType: 'integer', predicate: { op: 'lt', value: 8 } },
      ],
      'all'
    );
    expect(itemVariables).toEqual([{ name: 'q_1_score', question: 'q-1.score' }]);
    expect(expression).toBe(
      '(%q_1_score.first().toInteger() >= 3) and (%q_1_score.first().toInteger() < 8)'
    );
  });

  it('disambiguates a topic and a question that sanitize to the same name', () => {
    const { itemVariables } = compileEnableWhen(
      [
        coding(gender, { op: 'exists' }),
        coding({ kind: 'question', linkId: 'gender' }, { op: 'exists' }),
      ],
      'all'
    );
    expect(itemVariables.map((v) => v.name)).toEqual(['gender', 'gender_2']);
  });

  it('escapes quotes and backslashes in string values', () => {
    const { expression } = compileEnableWhen(
      [{ source: smoker, valueType: 'string', predicate: { op: 'eq', value: "it's \\ here" } }],
      'all'
    );
    expect(expression).toBe("%smoker.first() = 'it\\'s \\\\ here'");
    expect(evaluateEnableWhen(expression, { smoker: ["it's \\ here"] })).toBe(true);
  });

  it('rejects predicates the value type does not support', () => {
    expect(() => compileEnableWhen([coding(gender, { op: 'gt', value: 'x' })], 'all')).toThrow(
      EnableWhenCompileError
    );
    expect(() =>
      compileEnableWhen(
        [
          {
            source: smoker,
            valueType: 'string',
            predicate: { op: 'elapsedAtLeast', amount: 1, unit: 'years' },
          },
        ],
        'all'
      )
    ).toThrow(EnableWhenCompileError);
    // a year-only source has no finer resolution than years
    expect(() =>
      compileEnableWhen(
        [
          {
            source: { kind: 'question', linkId: 'born' },
            valueType: 'year',
            predicate: { op: 'elapsedAtLeast', amount: 6, unit: 'months' },
          },
        ],
        'all'
      )
    ).toThrow(EnableWhenCompileError);
  });

  it('rejects malformed values', () => {
    expect(() =>
      compileEnableWhen(
        [{ source: score, valueType: 'integer', predicate: { op: 'eq', value: 1.5 } }],
        'all'
      )
    ).toThrow(EnableWhenCompileError);
    expect(() =>
      compileEnableWhen(
        [{ source: birthDate, valueType: 'date', predicate: { op: 'gt', value: '2020' } }],
        'all'
      )
    ).toThrow(EnableWhenCompileError);
    expect(() =>
      compileEnableWhen(
        [
          {
            source: birthDate,
            valueType: 'date',
            predicate: { op: 'elapsedBetween', min: 5, max: 3, unit: 'years' },
          },
        ],
        'all'
      )
    ).toThrow(EnableWhenCompileError);
    expect(() => compileEnableWhen([coding(gender, { op: 'oneOf', values: [] })], 'all')).toThrow(
      EnableWhenCompileError
    );
    expect(() => compileEnableWhen([], 'all')).toThrow(EnableWhenCompileError);
  });

  it('reports the offending row index', () => {
    try {
      compileEnableWhen(
        [coding(gender, { op: 'exists' }), coding(gender, { op: 'gt', value: 'x' })],
        'all'
      );
      fail('expected a throw');
    } catch (e) {
      expect((e as EnableWhenCompileError).conditionIndex).toBe(1);
    }
  });
});

describe('requiresExpression', () => {
  it('is false for purely local static rows (native enableWhen)', () => {
    expect(
      requiresExpression([
        coding(smoker, { op: 'eq', value: 'yes' }),
        { source: score, valueType: 'integer', predicate: { op: 'gt', value: 2 } },
      ])
    ).toBe(false);
  });

  it('is true for a topic source, a temporal predicate, empty or oneOf', () => {
    expect(requiresExpression([coding(gender, { op: 'exists' })])).toBe(true);
    expect(
      requiresExpression([
        {
          source: { kind: 'question', linkId: 'dob' },
          valueType: 'date',
          predicate: { op: 'elapsedAtLeast', amount: 18, unit: 'years' },
        },
      ])
    ).toBe(true);
    expect(requiresExpression([coding(smoker, { op: 'empty' })])).toBe(true);
    expect(requiresExpression([coding(smoker, { op: 'oneOf', values: ['a'] })])).toBe(true);
  });
});

/** Every value type x every predicate it supports, both alone and combined, must round-trip and evaluate. */
const sampleCondition = (
  valueType: EnableWhenCondition['valueType'],
  op: string,
  source: EnableWhenSource
): EnableWhenCondition => {
  const sample: Record<EnableWhenCondition['valueType'], string | number> = {
    coding: 'female',
    string: 'Berlin',
    integer: 5,
    decimal: 5.5,
    date: '2020-01-01',
    year: '2000',
  };
  const predicate = ((): EnableWhenCondition['predicate'] => {
    switch (op) {
      case 'exists':
      case 'empty':
        return { op };
      case 'oneOf':
        return { op, values: ['female', 'diverse'] };
      case 'elapsedAtLeast':
      case 'elapsedLessThan':
        return { op, amount: 18, unit: valueType === 'year' ? 'years' : 'months' };
      case 'elapsedBetween':
        return { op, min: 18, max: 66, unit: valueType === 'year' ? 'years' : 'days' };
      default:
        return { op: op as 'eq', value: sample[valueType] };
    }
  })();
  return { source, valueType, predicate };
};

const allConditions: EnableWhenCondition[] = Object.entries(
  ENABLE_WHEN_PREDICATES_BY_VALUE_TYPE
).flatMap(([valueType, ops]) =>
  ops.map((op, i) =>
    sampleCondition(
      valueType as EnableWhenCondition['valueType'],
      op,
      i % 2 === 0
        ? { kind: 'topic', topic: `${valueType}Topic`, scope: 'all' }
        : { kind: 'question', linkId: `${valueType}-q${i}` }
    )
  )
);

describe('compile -> decompile round trip', () => {
  it.each(allConditions.map((c) => [c.valueType, c.predicate.op, c] as const))(
    'single row %s %s',
    (_valueType, _op, condition) => {
      const compiled = compileEnableWhen([condition], 'all');
      expect(findSubsetViolations(compiled.expression)).toEqual([]);
      const decompiled = decompileEnableWhen(
        compiled.itemVariables,
        compiled.expression,
        () => condition.valueType
      );
      expect(decompiled).toEqual({ conditions: [condition], behavior: 'all' });
    }
  );

  it.each(['all', 'any'] as const)('all rows combined with %s', (behavior) => {
    const compiled = compileEnableWhen(allConditions, behavior);
    expect(findSubsetViolations(compiled.expression)).toEqual([]);
    const byKey = new Map(allConditions.map((c) => [JSON.stringify(c.source), c.valueType]));
    const decompiled = decompileEnableWhen(compiled.itemVariables, compiled.expression, (s) =>
      byKey.get(JSON.stringify(s))
    );
    expect(decompiled).toEqual({ conditions: allConditions, behavior });
  });

  it('infers value types from the expression shape when no resolver is given', () => {
    const rows: EnableWhenCondition[] = [
      coding(gender, { op: 'oneOf', values: ['female', 'diverse'] }),
      { source: score, valueType: 'integer', predicate: { op: 'neq', value: 4 } },
      { source: smoker, valueType: 'string', predicate: { op: 'eq', value: 'x' } },
      {
        source: birthDate,
        valueType: 'date',
        predicate: { op: 'elapsedLessThan', amount: 8, unit: 'days' },
      },
      { source: birthDate, valueType: 'date', predicate: { op: 'lteq', value: '2020-05-05' } },
      {
        source: { kind: 'question', linkId: 'born' },
        valueType: 'year',
        predicate: { op: 'gt', value: '1999' },
      },
    ];
    const compiled = compileEnableWhen(rows, 'any');
    expect(decompileEnableWhen(compiled.itemVariables, compiled.expression)).toEqual({
      conditions: rows,
      behavior: 'any',
    });
  });

  it('defaults an untyped exists row to string and lets the resolver override it', () => {
    const compiled = compileEnableWhen([coding(gender, { op: 'exists' })], 'all');
    expect(
      decompileEnableWhen(compiled.itemVariables, compiled.expression)?.conditions[0].valueType
    ).toBe('string');
    expect(
      decompileEnableWhen(compiled.itemVariables, compiled.expression, () => 'coding')
        ?.conditions[0].valueType
    ).toBe('coding');
  });

  it('tolerates extra whitespace and an enclosing pair of parentheses', () => {
    const vars = [{ name: 'gender', topic: 'gender', scope: 'latest' as const }];
    expect(
      decompileEnableWhen(vars, "  ( %gender.exists()   and (%gender contains 'male').not() ) ")
    ).toEqual({
      conditions: [coding(gender, { op: 'neq', value: 'male' })],
      behavior: 'all',
    });
  });
});

describe('decompileEnableWhen returns null for non-canonical input', () => {
  const vars = [
    { name: 'gender', topic: 'gender', scope: 'latest' as const },
    { name: 'smoker', question: 'smoker' },
  ];

  it.each([
    "%gender.exists() and %gender != 'male'", // hand-written: singleton inequality, not the canonical membership form
    "%gender.where($this = 'male').exists()", // out of subset
    "(%smoker contains 'yes') and (%gender contains 'x') or (%gender.exists())", // mixed connectors
    "%unknown contains 'x'", // unbound variable
    '%gender.first().toInteger() > 5', // integer comparison on a coding source (resolver says coding)
  ])('%s', (expression) => {
    expect(decompileEnableWhen(vars, expression, () => 'coding')).toBeNull();
  });

  it('rejects a binding with both or neither source', () => {
    expect(
      decompileEnableWhen([{ name: 'x', topic: 't', question: 'q' }], '%x.exists()')
    ).toBeNull();
    expect(decompileEnableWhen([{ name: 'x' }], '%x.exists()')).toBeNull();
  });
});

describe('compiled expressions evaluate as authored', () => {
  afterEach(() => jest.useRealTimers());

  const evalAt = (
    now: string,
    conditions: EnableWhenCondition[],
    behavior: 'all' | 'any',
    variables: Record<string, string[]>
  ) => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(`${now}T12:00:00Z`));
    return evaluateEnableWhen(compileEnableWhen(conditions, behavior).expression, variables);
  };

  it('elapsed less than 18 years ("age at most 17") excludes the 18th birthday', () => {
    const rows: EnableWhenCondition[] = [
      {
        source: birthDate,
        valueType: 'date',
        predicate: { op: 'elapsedLessThan', amount: 18, unit: 'years' },
      },
    ];
    expect(evalAt('2026-08-31', rows, 'all', { birthDate: ['2008-09-01'] })).toBe(true); // still 17
    expect(evalAt('2026-08-31', rows, 'all', { birthDate: ['2008-08-31'] })).toBe(false); // turned 18 today
  });

  it('age between is inclusive on both ends', () => {
    const rows: EnableWhenCondition[] = [
      {
        source: birthDate,
        valueType: 'date',
        predicate: { op: 'elapsedBetween', min: 18, max: 66, unit: 'years' },
      },
    ];
    expect(evalAt('2026-08-31', rows, 'all', { birthDate: ['2008-08-31'] })).toBe(true); // 18 today
    expect(evalAt('2026-08-31', rows, 'all', { birthDate: ['1960-09-01'] })).toBe(true); // 65, turns 66 tomorrow
    expect(evalAt('2026-08-31', rows, 'all', { birthDate: ['1960-08-31'] })).toBe(false); // 66 today
  });

  it('elapsedAtLeast and elapsedLessThan are exact complements on the boundary day', () => {
    const enrolled: EnableWhenSource = { kind: 'topic', topic: 'enrolledAt', scope: 'latest' };
    const atLeast: EnableWhenCondition[] = [
      {
        source: enrolled,
        valueType: 'date',
        predicate: { op: 'elapsedAtLeast', amount: 30, unit: 'days' },
      },
    ];
    const lessThan: EnableWhenCondition[] = [
      {
        source: enrolled,
        valueType: 'date',
        predicate: { op: 'elapsedLessThan', amount: 30, unit: 'days' },
      },
    ];
    for (const [date, expected] of [
      ['2026-08-01', true], // exactly 30 days
      ['2026-08-02', false], // 29 days
      ['2026-07-31', true], // 31 days
    ] as const) {
      expect(evalAt('2026-08-31', atLeast, 'all', { enrolledAt: [date] })).toBe(expected);
      expect(evalAt('2026-08-31', lessThan, 'all', { enrolledAt: [date] })).toBe(!expected);
    }
    expect(evalAt('2026-08-31', atLeast, 'all', { enrolledAt: [] })).toBe(false);
    expect(evalAt('2026-08-31', lessThan, 'all', { enrolledAt: [] })).toBe(false);
  });

  it('coding neq on a multi-value source hides when any value matches', () => {
    const rows = [coding(gender, { op: 'neq', value: 'male' })];
    expect(evalAt('2026-08-31', rows, 'all', { gender: ['female', 'male'] })).toBe(false);
    expect(evalAt('2026-08-31', rows, 'all', { gender: ['female'] })).toBe(true);
    expect(evalAt('2026-08-31', rows, 'all', { gender: [] })).toBe(false);
  });

  it('numeric comparisons work on string-typed variables', () => {
    const rows: EnableWhenCondition[] = [
      { source: score, valueType: 'decimal', predicate: { op: 'gteq', value: 2.5 } },
      { source: score, valueType: 'decimal', predicate: { op: 'neq', value: 3 } },
    ];
    expect(evalAt('2026-08-31', rows, 'all', { q_1_score: ['2.5'] })).toBe(true);
    expect(evalAt('2026-08-31', rows, 'all', { q_1_score: ['3'] })).toBe(false);
    expect(evalAt('2026-08-31', rows, 'all', { q_1_score: [] })).toBe(false);
  });

  it('any-of shows when a single row holds', () => {
    const rows = [
      coding(smoker, { op: 'eq', value: 'yes' }),
      coding(gender, { op: 'eq', value: 'female' }),
    ];
    expect(evalAt('2026-08-31', rows, 'any', { smoker: ['no'], gender: ['female'] })).toBe(true);
    expect(evalAt('2026-08-31', rows, 'all', { smoker: ['no'], gender: ['female'] })).toBe(false);
  });
});
