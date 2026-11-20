import { InputType, Operator, Question, Questionnaire } from '@d4l/grpc-modules/research-pillars';
import { generateFHIRQuestionnaire } from '../questionnaire';

const OPTIONS = {
  baseUrl: 'https://collect.example.org/fhir/r5',
  staticUrl: 'https://collect.example.org/api/static',
  programName: 'program',
  languages: ['en', 'de'],
  date: '2026-01-02T03:04:05Z',
  timestamp: '2026-01-02T03:04:05Z',
};

const question = (overrides: Partial<Question>): Question => ({
  linkId: 'q1',
  inputType: InputType.string,
  required: false,
  text: { en: 'Question', de: 'Frage' },
  enableWhen: [],
  prepopulate: [],
  items: [],
  input: [],
  output: [],
  itemVariables: [],
  code: [],
  ...overrides,
});

const definition = (...questions: Question[]): Questionnaire => ({
  name: 'q',
  version: '1.0.0',
  title: { en: 'Title', de: 'Titel' },
  questions,
});

const generate = (...questions: Question[]) =>
  JSON.parse(JSON.stringify(generateFHIRQuestionnaire(definition(...questions), OPTIONS)));

const answerset = (system?: string) => ({
  order: 'default',
  answers: [
    { code: 'a', languages: { en: 'A', de: 'A' } },
    { code: 'b', languages: { en: 'B', de: 'B' } },
  ],
  ...(system && { system }),
});

describe('generateFHIRQuestionnaire', () => {
  it('generates one FHIR Questionnaire per language', () => {
    const generated = generate(question({ required: true }));

    expect(Object.keys(generated)).toEqual(['en', 'de']);
    expect(generated.de).toStrictEqual({
      resourceType: 'Questionnaire',
      language: 'de',
      name: 'q',
      url: 'https://collect.example.org/fhir/r5/program/Questionnaire/q',
      status: 'active',
      publisher: 'D4L data4life gGmbH',
      contact: [
        { name: 'D4L data4life gGmbH', telecom: [{ system: 'url', value: 'https://www.data4life.care' }] },
      ],
      version: '1.0.0',
      title: 'Titel',
      date: '2026-01-02T03:04:05Z',
      subjectType: ['Patient'],
      item: [{ linkId: 'q1', type: 'string', text: 'Frage', required: true }],
    });
  });

  it('throws on a missing translation', () => {
    expect(() => generate(question({ text: { en: 'Question' } }))).toThrow(/translation/);
  });

  it('throws on an unsupported input type', () => {
    expect(() => generate(question({ inputType: InputType.UNRECOGNIZED }))).toThrow(/input type/);
  });

  describe('answer sets', () => {
    it('writes the Default Code System for an answer set without a system', () => {
      const { en } = generate(question({ inputType: InputType.single_select, answerset: answerset() }));

      expect(en.item[0].answerValueSet).toBe('#0');
      expect(en.contained).toHaveLength(1);
      expect(en.contained[0].url).toBe('https://collect.example.org/fhir/r5/program/ValueSet/q/q1');
      expect(en.contained[0].compose.include[0].system).toBe(
        'https://collect.example.org/fhir/r5/program/CodeSystem/q/q1'
      );
    });

    it('shares one contained value set between questions with the same custom system and answers', () => {
      const system = 'http://example.org/CodeSystem/mood';
      const { en } = generate(
        question({ linkId: 'q1', inputType: InputType.single_select, answerset: answerset(system) }),
        question({ linkId: 'q2', inputType: InputType.single_select, answerset: answerset(system) })
      );

      expect(en.item.map((i: { answerValueSet: string }) => i.answerValueSet)).toEqual(['#0', '#0']);
      expect(en.contained).toHaveLength(1);
      expect(en.contained[0].url).toBe('https://collect.example.org/fhir/r5/program/ValueSet/q/mood');
      expect(en.contained[0].compose.include[0].system).toBe(system);
    });

    const select = (linkId: string, set: ReturnType<typeof answerset>) =>
      question({ linkId, inputType: InputType.single_select, answerset: set });
    const references = (en: { item: { answerValueSet: string }[] }) => en.item.map((i) => i.answerValueSet);
    const systems = (en: { contained: { compose: { include: { system: string }[] } }[] }) =>
      en.contained.map((vs) => vs.compose.include[0].system);
    const urls = (en: { contained: { url: string }[] }) => en.contained.map((vs) => vs.url);
    const vsUrl = (id: string) => `https://collect.example.org/fhir/r5/program/ValueSet/q/${id}`;

    it('names distinct custom systems with the same last segment after their link ids', () => {
      const first = 'http://example.org/a/CodeSystem/mood';
      const second = 'http://example.org/b/CodeSystem/mood';
      const { en } = generate(select('q1', answerset(first)), select('q2', answerset(second)));

      expect(references(en)).toEqual(['#0', '#1']);
      expect(systems(en)).toEqual([first, second]);
      expect(urls(en)).toEqual([vsUrl('q1'), vsUrl('q2')]);
    });

    it("does not name a custom system's value set after another question's link id", () => {
      const system = 'http://example.org/CodeSystem/q1';
      const { en } = generate(select('q1', answerset()), select('q2', answerset(system)));

      expect(references(en)).toEqual(['#0', '#1']);
      expect(systems(en)).toEqual(['https://collect.example.org/fhir/r5/program/CodeSystem/q/q1', system]);
      expect(urls(en)).toEqual([vsUrl('q1'), vsUrl('q2')]);
    });

    it('keeps different answer subsets of one custom system apart', () => {
      const system = 'http://example.org/CodeSystem/mood';
      const subset = { ...answerset(system), answers: answerset().answers.slice(0, 1) };
      const { en } = generate(select('q1', answerset(system)), select('q2', subset));

      expect(references(en)).toEqual(['#0', '#1']);
      expect(
        en.contained.map((vs: { expansion: { contains: unknown[] } }) => vs.expansion.contains.length)
      ).toEqual([2, 1]);
      expect(urls(en)).toEqual([vsUrl('q1'), vsUrl('q2')]);
    });

    it('keeps identical answer sets without a system apart', () => {
      const { en } = generate(select('q1', answerset()), select('q2', answerset()));

      expect(references(en)).toEqual(['#0', '#1']);
      expect(systems(en)).toEqual([
        'https://collect.example.org/fhir/r5/program/CodeSystem/q/q1',
        'https://collect.example.org/fhir/r5/program/CodeSystem/q/q2',
      ]);
    });

    it('keeps answer sets of one custom system with different translations or order apart', () => {
      const system = 'http://example.org/CodeSystem/mood';
      const relabeled = {
        ...answerset(system),
        answers: [{ code: 'a', languages: { en: 'Other', de: 'A' } }, answerset().answers[1]],
      };
      const reordered = { ...answerset(system), order: 'random' };
      const { en } = generate(
        select('q1', answerset(system)),
        select('q2', relabeled),
        select('q3', reordered)
      );

      expect(references(en)).toEqual(['#0', '#1', '#2']);
    });

    it('gives the same value set references in every language', () => {
      const system = 'http://example.org/CodeSystem/mood';
      const { en, de } = generate(
        select('q1', answerset(system)),
        select('q2', { ...answerset(system), answers: answerset().answers.slice(1) }),
        select('q3', answerset(system))
      );

      expect(references(en)).toEqual(['#0', '#1', '#0']);
      expect(references(de)).toEqual(references(en));
      expect(urls(de)).toEqual(urls(en));
    });

    it('derives a deterministic UUIDv5 expansion identifier per value set and language', () => {
      const q = question({ inputType: InputType.single_select, answerset: answerset() });
      const first = generate(q);
      const second = generate(q);

      const identifier = first.en.contained[0].expansion.identifier;
      expect(identifier).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(second.en.contained[0].expansion.identifier).toBe(identifier);
      expect(first.de.contained[0].expansion.identifier).not.toBe(identifier);
      expect(first.en.contained[0].expansion.timestamp).toBe(OPTIONS.timestamp);
    });
  });

  describe('enableWhen', () => {
    it("writes enableBehavior 'all' for a native enableWhen without Enable Behavior", () => {
      const { en } = generate(
        question({ linkId: 'q1' }),
        question({ linkId: 'q2', enableWhen: [{ question: 'q1', operator: Operator.exists }] })
      );

      expect(en.item[1].enableBehavior).toBe('all');
      expect(en.item[1].enableWhen).toEqual([{ question: 'q1', operator: 'exists' }]);
    });

    it('writes the Effective Code System of the referenced question on answerCoding', () => {
      const system = 'http://example.org/CodeSystem/mood';
      const { en } = generate(
        question({ linkId: 'custom', inputType: InputType.single_select, answerset: answerset(system) }),
        question({ linkId: 'default', inputType: InputType.single_select, answerset: answerset() }),
        question({
          linkId: 'dependent',
          enableBehavior: 'any',
          enableWhen: [
            { question: 'custom', operator: Operator.eq, answerCoding: 'a' },
            { question: 'default', operator: Operator.eq, answerCoding: 'b' },
          ],
        })
      );

      expect(en.item[2].enableBehavior).toBe('any');
      expect(en.item[2].enableWhen.map((ew: { answerCoding: unknown }) => ew.answerCoding)).toEqual([
        { code: 'a', system },
        { code: 'b', system: 'https://collect.example.org/fhir/r5/program/CodeSystem/q/default' },
      ]);
    });

    it('writes the ISO 3166 code system on answerCoding for a condition on a country question', () => {
      const { en } = generate(
        question({ linkId: 'country', inputType: InputType.country }),
        question({
          linkId: 'dependent',
          enableWhen: [{ question: 'country', operator: Operator.eq, answerCoding: 'DE' }],
        })
      );

      expect(en.item[1].enableWhen[0].answerCoding).toEqual({ code: 'DE', system: 'urn:iso:std:iso:3166' });
    });

    it('writes no enableBehavior for an expression dependency', () => {
      const { en } = generate(
        question({ linkId: 'q1' }),
        question({
          linkId: 'q2',
          enableBehavior: 'any',
          itemVariables: [{ name: 'a', question: 'q1' }],
          enableWhenExpression: '%a.exists()',
        })
      );

      expect(en.item[1].enableBehavior).toBeUndefined();
      expect(en.item[1].enableWhen).toBeUndefined();
      expect(en.item[1].modifierExtension).toEqual([
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression',
          valueExpression: { language: 'text/fhirpath', expression: '%a.exists()' },
        },
      ]);
    });
  });

  it('references an image by link under the static URL', () => {
    const { en } = generate(
      question({
        inputType: InputType.display,
        image: { src: 'cover.png', alt: 'Cover', data: '', contentType: '' },
      })
    );

    expect(en.item[0].extension).toEqual([
      {
        url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemMedia',
        valueAttachment: {
          url: 'https://collect.example.org/api/static/programs/program/images/cover.png',
          title: 'Cover',
        },
      },
    ]);
  });
});
