import {
  CountryValueSet,
  EnableWhenExpressionExtension,
  ImageExtension,
  ItemVariableNameUrl,
  ItemVariableQuestionUrl,
  ItemVariableScopeUrl,
  ItemVariableTopicUrl,
  MaxValueExtension,
  MinLengthExtension,
  MinValueExtension,
  PlaceholderExtension,
  PostalCodeCountrySourceExtension,
  PostalCodeFixedCountryUrl,
  PostalCodeFromItemUrl,
  QItemControlDefinition,
  QuestionnaireItemInputExtension,
  QuestionnaireItemOutputExtension,
  QuestionnaireItemVariableExtension,
  RelativeMaxValueExtension,
  RelativeMinValueExtension,
  SliderInputLabel,
  SliderMaxLabelExtension,
  SliderMinLabelExtension,
  SliderOrientationExtension,
  SliderStepSizeExtension,
  TopicInputScopeUrl,
  TopicInputTopicUrl,
  ValuesetSortingExtension,
} from '../constants';
import { inputTypeFromJSON, TopicScope } from '@d4l/grpc-modules/research-pillars';
import { parseFHIRQuestionnaire, parseExtensions } from '../questionnaire';

const TOPIC = 'http://fhir.data4life.care/r5/example/topic/socialNetwork';
const BAD_TOPIC = 'http://fhir.data4life.care/r5/example/topic/social-network';

const makeItems = (
  extensionsByLanguage: Record<string, fhir5.Extension[]>
): Record<string, fhir5.QuestionnaireItem> =>
  Object.fromEntries(
    Object.entries(extensionsByLanguage).map(([lang, extensions]) => [
      lang,
      { linkId: 'q1', type: 'decimal' as const, extension: extensions },
    ])
  );

describe('parseExtensions', () => {
  it('returns empty config and no input type when there are no extensions', () => {
    const items = makeItems({ en: [] });
    const { config, inputType } = parseExtensions(['en'], items);
    expect(config).toEqual({});
    expect(inputType).toBeUndefined();
  });

  it('ignores unknown extensions', () => {
    const items = makeItems({ en: [{ url: 'http://unknown.example.com/ext' }] });
    const { config, inputType } = parseExtensions(['en'], items);
    expect(config).toEqual({});
    expect(inputType).toBeUndefined();
  });

  describe('MaxValueExtension', () => {
    it.each([
      ['decimal', { valueDecimal: 100 }, 100],
      ['integer', { valueInteger: 50 }, 50],
      ['date', { valueDate: '2025-12-31' }, '2025-12-31'],
    ] as const)('parses a %s max value', (_, extension, expected) => {
      const items = makeItems({ en: [{ url: MaxValueExtension, ...extension }] });
      const { config } = parseExtensions(['en'], items);
      expect(config).toEqual({ max: expected });
    });
  });

  describe('MinValueExtension', () => {
    it.each([
      ['decimal', { valueDecimal: 0 }, 0],
      ['integer', { valueInteger: -10 }, -10],
    ] as const)('parses a %s min value', (_, extension, expected) => {
      const items = makeItems({ en: [{ url: MinValueExtension, ...extension }] });
      const { config } = parseExtensions(['en'], items);
      expect(config).toEqual({ min: expected });
    });
  });

  describe('RelativeMinValueExtension', () => {
    it('parses a relative min value string', () => {
      const items = makeItems({ en: [{ url: RelativeMinValueExtension, valueString: 'today' }] });
      const { config } = parseExtensions(['en'], items);
      expect(config).toEqual({ min: 'today' });
    });
  });

  describe('RelativeMaxValueExtension', () => {
    it('parses a relative max value string', () => {
      const items = makeItems({
        en: [{ url: RelativeMaxValueExtension, valueString: 'today+30' }],
      });
      const { config } = parseExtensions(['en'], items);
      expect(config).toEqual({ max: 'today+30' });
    });
  });

  describe('SliderStepSizeExtension', () => {
    it('parses a step size', () => {
      const items = makeItems({ en: [{ url: SliderStepSizeExtension, valueDecimal: 0.5 }] });
      const { config } = parseExtensions(['en'], items);
      expect(config).toEqual({ step: 0.5 });
    });
  });

  describe('SliderOrientationExtension', () => {
    it.each(['horizontal', 'vertical'] as const)('parses %s orientation', (orientation) => {
      const items = makeItems({
        en: [{ url: SliderOrientationExtension, valueCode: orientation }],
      });
      const { config } = parseExtensions(['en'], items);
      expect(config).toEqual({ orientation });
    });

    it('ignores unsupported orientation values', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const items = makeItems({ en: [{ url: SliderOrientationExtension, valueCode: 'diagonal' }] });
      const { config } = parseExtensions(['en'], items);
      expect(config).toEqual({});
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('diagonal'));
      warn.mockRestore();
    });
  });

  describe('QItemControlDefinition', () => {
    it.each([
      'postal_code',
      'scale_ordinal',
      'scale_numeric',
      'scale_likert',
      'year',
      'geo_location',
    ] as const)('parses the input type from a real itemControl code (%s)', (code) => {
      // A postal code needs its country source to parse (pccs-1).
      const countrySource: fhir5.Extension[] =
        code === 'postal_code'
          ? [
              {
                url: PostalCodeCountrySourceExtension,
                extension: [{ url: PostalCodeFromItemUrl, valueString: 'c' }],
              },
            ]
          : [];
      const items = makeItems({
        en: [{ url: QItemControlDefinition, valueCodeableConcept: { coding: [{ code }] } }, ...countrySource],
      });
      const { inputType } = parseExtensions(['en'], items);
      expect(inputType).toBe(inputTypeFromJSON(code));
    });
  });

  describe('ImageExtension', () => {
    it('parses a remote reference image, keeping only the URL basename', () => {
      const items = makeItems({
        en: [
          {
            url: ImageExtension,
            valueAttachment: {
              url: 'https://static.example.com/programs/my-program/images/abc123',
              title: 'A cover photo',
            },
          },
        ],
      });
      const { image } = parseExtensions(['en'], items);
      expect(image).toEqual({ src: 'abc123', alt: 'A cover photo', data: '', contentType: '' });
    });

    it('parses an inline image, keeping the base64 payload', () => {
      const items = makeItems({
        en: [
          {
            url: ImageExtension,
            valueAttachment: {
              data: 'ZmFrZS1ieXRlcw==',
              contentType: 'image/png',
              title: 'A cover photo',
            },
          },
        ],
      });
      const { image } = parseExtensions(['en'], items);
      expect(image).toEqual({
        src: '',
        alt: 'A cover photo',
        data: 'ZmFrZS1ieXRlcw==',
        contentType: 'image/png',
      });
    });

    it('ignores an image extension with neither a url nor inline data', () => {
      const items = makeItems({
        en: [{ url: ImageExtension, valueAttachment: { title: 'Untitled' } }],
      });
      const { image } = parseExtensions(['en'], items);
      expect(image).toBeUndefined();
    });
  });

  describe('localized extensions', () => {
    it('collects minLabel across all languages', () => {
      const items = makeItems({
        en: [{ url: SliderMinLabelExtension, valueString: 'Min' }],
        de: [{ url: SliderMinLabelExtension, valueString: 'Minimum' }],
      });
      const { config } = parseExtensions(['en', 'de'], items);
      expect(config).toEqual({ minLabel: { en: 'Min', de: 'Minimum' } });
    });

    it('collects maxLabel across all languages', () => {
      const items = makeItems({
        en: [{ url: SliderMaxLabelExtension, valueString: 'Max' }],
        de: [{ url: SliderMaxLabelExtension, valueString: 'Maximum' }],
      });
      const { config } = parseExtensions(['en', 'de'], items);
      expect(config).toEqual({ maxLabel: { en: 'Max', de: 'Maximum' } });
    });

    it('collects inputLabel across all languages', () => {
      const items = makeItems({
        en: [{ url: SliderInputLabel, valueString: 'Input' }],
        de: [{ url: SliderInputLabel, valueString: 'Eingabe' }],
      });
      const { config } = parseExtensions(['en', 'de'], items);
      expect(config).toEqual({ inputLabel: { en: 'Input', de: 'Eingabe' } });
    });
  });

  describe('topic input/output', () => {
    it('parses an output extension into a bare topic id', () => {
      const items = makeItems({
        en: [{ url: QuestionnaireItemOutputExtension, valueCanonical: TOPIC }],
      });
      const { input, output } = parseExtensions(['en'], items);
      expect(output).toEqual(['socialNetwork']);
      expect(input).toEqual([]);
    });

    it('parses an input extension into a topic id + scope', () => {
      const items = makeItems({
        en: [
          {
            url: QuestionnaireItemInputExtension,
            extension: [
              { url: TopicInputTopicUrl, valueCanonical: TOPIC },
              { url: TopicInputScopeUrl, valueCode: 'all' },
            ],
          },
        ],
      });
      const { input, output } = parseExtensions(['en'], items);
      expect(input).toEqual([{ topic: 'socialNetwork', scope: TopicScope.all }]);
      expect(output).toEqual([]);
    });

    it('ignores an output topic whose id is not identifier-safe', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const items = makeItems({
        en: [{ url: QuestionnaireItemOutputExtension, valueCanonical: BAD_TOPIC }],
      });
      expect(parseExtensions(['en'], items).output).toEqual([]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('malformed topic output extension'));
      warn.mockRestore();
    });

    it('ignores an input extension with a missing scope', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const items = makeItems({
        en: [
          {
            url: QuestionnaireItemInputExtension,
            extension: [{ url: TopicInputTopicUrl, valueCanonical: TOPIC }],
          },
        ],
      });
      expect(parseExtensions(['en'], items).input).toEqual([]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('malformed topic input extension'));
      warn.mockRestore();
    });

    it('ignores an input extension with an unrecognized scope', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const items = makeItems({
        en: [
          {
            url: QuestionnaireItemInputExtension,
            extension: [
              { url: TopicInputTopicUrl, valueCanonical: TOPIC },
              { url: TopicInputScopeUrl, valueCode: 'sometimes' },
            ],
          },
        ],
      });
      expect(parseExtensions(['en'], items).input).toEqual([]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('malformed topic input extension'));
      warn.mockRestore();
    });
  });

  describe('string length (minLength/maxLength)', () => {
    const makeStringItems = (overrides: Partial<fhir5.QuestionnaireItem> = {}) => ({
      en: { linkId: 'q1', type: 'string' as const, extension: [], ...overrides },
    });

    it('reads maxLength from the native FHIR field for a string question', () => {
      const items = makeStringItems({ maxLength: 50 });
      expect(parseExtensions(['en'], items).config).toEqual({ maxLength: 50 });
    });

    it('reads maxLength for a text question too', () => {
      const items = makeStringItems({ type: 'text', maxLength: 500 });
      expect(parseExtensions(['en'], items).config).toEqual({ maxLength: 500 });
    });

    it('reads minLength from the extension', () => {
      const items = makeStringItems({ extension: [{ url: MinLengthExtension, valueInteger: 3 }] });
      expect(parseExtensions(['en'], items).config).toEqual({ minLength: 3 });
    });

    it('reads both min and max length together', () => {
      const items = makeStringItems({
        maxLength: 50,
        extension: [{ url: MinLengthExtension, valueInteger: 3 }],
      });
      expect(parseExtensions(['en'], items).config).toEqual({ minLength: 3, maxLength: 50 });
    });

    it('ignores maxLength on a non-string/text question', () => {
      const items = {
        en: { linkId: 'q1', type: 'decimal' as const, maxLength: 50, extension: [] },
      };
      expect(parseExtensions(['en'], items).config).toEqual({});
    });
  });

  describe('PostalCodeCountrySourceExtension', () => {
    it('parses a fromItem country source', () => {
      const items = makeItems({
        en: [
          {
            url: PostalCodeCountrySourceExtension,
            extension: [{ url: PostalCodeFromItemUrl, valueString: 'country-question' }],
          },
        ],
      });
      expect(parseExtensions(['en'], items).config).toEqual({
        countrySource: { fromItem: 'country-question' },
      });
    });

    it('parses a fixedCountry country source', () => {
      const items = makeItems({
        en: [
          {
            url: PostalCodeCountrySourceExtension,
            extension: [
              {
                url: PostalCodeFixedCountryUrl,
                valueCoding: { system: 'urn:iso:std:iso:3166', code: 'DE' },
              },
            ],
          },
        ],
      });
      expect(parseExtensions(['en'], items).config).toEqual({
        countrySource: { fixedCountry: { system: 'urn:iso:std:iso:3166', code: 'DE' } },
      });
    });

    it('ignores a malformed country-source extension (neither sub-extension set)', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const items = makeItems({ en: [{ url: PostalCodeCountrySourceExtension, extension: [] }] });
      expect(parseExtensions(['en'], items).config).toEqual({});
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('country-source'));
      warn.mockRestore();
    });

    describe('on a postal code question (pccs-1)', () => {
      const postalCode: fhir5.Extension = {
        url: QItemControlDefinition,
        valueCodeableConcept: { coding: [{ code: 'postal_code' }] },
      };
      const fromItem = { url: PostalCodeFromItemUrl, valueString: 'country-question' };
      const fixedCountry = {
        url: PostalCodeFixedCountryUrl,
        valueCoding: { system: 'urn:iso:std:iso:3166', code: 'DE' },
      };
      const message =
        'Question q1: postal_code countrySource must include exactly one of fromItem or fixedCountry';

      it('accepts exactly one country source', () => {
        const items = makeItems({
          en: [postalCode, { url: PostalCodeCountrySourceExtension, extension: [fromItem] }],
        });
        expect(parseExtensions(['en'], items).config).toEqual({
          countrySource: { fromItem: 'country-question' },
        });
      });

      it('rejects a missing country source', () => {
        const items = makeItems({ en: [postalCode] });
        expect(() => parseExtensions(['en'], items)).toThrow(message);
      });

      it('rejects both sources in one extension', () => {
        const items = makeItems({
          en: [postalCode, { url: PostalCodeCountrySourceExtension, extension: [fromItem, fixedCountry] }],
        });
        expect(() => parseExtensions(['en'], items)).toThrow(message);
      });

      it('rejects two country-source extensions', () => {
        const items = makeItems({
          en: [
            postalCode,
            { url: PostalCodeCountrySourceExtension, extension: [fromItem] },
            { url: PostalCodeCountrySourceExtension, extension: [fixedCountry] },
          ],
        });
        expect(() => parseExtensions(['en'], items)).toThrow(message);
      });

      describe('in every language, not only the first', () => {
        const fromItemSource = { url: PostalCodeCountrySourceExtension, extension: [fromItem] };
        const fixedCountrySource = { url: PostalCodeCountrySourceExtension, extension: [fixedCountry] };

        it('accepts the same country source in every language', () => {
          const items = makeItems({ de: [postalCode, fromItemSource], en: [postalCode, fromItemSource] });
          expect(parseExtensions(['de', 'en'], items).config).toEqual({
            countrySource: { fromItem: 'country-question' },
          });
        });

        it('rejects a missing country source in a later language', () => {
          const items = makeItems({ de: [postalCode, fromItemSource], en: [postalCode] });
          expect(() => parseExtensions(['de', 'en'], items)).toThrow(`${message} (language en)`);
        });

        it('rejects both sources in a later language', () => {
          const items = makeItems({
            de: [postalCode, fromItemSource],
            en: [postalCode, { url: PostalCodeCountrySourceExtension, extension: [fromItem, fixedCountry] }],
          });
          expect(() => parseExtensions(['de', 'en'], items)).toThrow(`${message} (language en)`);
        });

        it('rejects different country sources between languages', () => {
          const items = makeItems({ de: [postalCode, fromItemSource], en: [postalCode, fixedCountrySource] });
          expect(() => parseExtensions(['de', 'en'], items)).toThrow(
            'Question q1: postal_code countrySource differs between languages de and en'
          );
        });
      });
    });
  });

  describe('PlaceholderExtension', () => {
    it('collects placeholder tokens in order', () => {
      const items = makeItems({
        en: [
          { url: PlaceholderExtension, valueString: 'firstName' },
          { url: PlaceholderExtension, valueString: 'studyName' },
        ],
      });
      expect(parseExtensions(['en'], items).config).toEqual({
        placeholders: ['firstName', 'studyName'],
      });
    });
  });
});

describe('enableWhen expression dependencies', () => {
  const variable = (
    name: string,
    source: { topic?: string; scope?: string; question?: string }
  ): fhir5.Extension => ({
    url: QuestionnaireItemVariableExtension,
    extension: [
      { url: ItemVariableNameUrl, valueString: name },
      ...(source.topic ? [{ url: ItemVariableTopicUrl, valueCanonical: source.topic }] : []),
      ...(source.scope ? [{ url: ItemVariableScopeUrl, valueCode: source.scope }] : []),
      ...(source.question ? [{ url: ItemVariableQuestionUrl, valueString: source.question }] : []),
    ],
  });

  it('parses topic- and question-sourced item variables', () => {
    const items = makeItems({
      en: [variable('gender', { topic: TOPIC, scope: 'latest' }), variable('smoker', { question: 'smoker' })],
    });
    expect(parseExtensions(['en'], items).itemVariables).toEqual([
      { name: 'gender', topic: 'socialNetwork', scope: TopicScope.latest },
      { name: 'smoker', question: 'smoker' },
    ]);
  });

  it('ignores malformed item variables', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const items = makeItems({
      en: [
        variable('', { question: 'q' }),
        variable('noSource', {}),
        variable('both', { topic: TOPIC, scope: 'latest', question: 'q' }),
        variable('noScope', { topic: TOPIC }),
        variable('badTopic', { topic: BAD_TOPIC, scope: 'latest' }),
        variable('badScope', { topic: TOPIC, scope: 'sometimes' }),
      ],
    });
    expect(parseExtensions(['en'], items).itemVariables).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(6);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('malformed item variable extension'));
    warn.mockRestore();
  });

  it('imports an expression dependency with its bindings and marks the question as dependent', () => {
    const expression = "%gender.exists() and (%gender contains 'male').not()";
    const questionnaire = parseFHIRQuestionnaire({
      en: {
        resourceType: 'Questionnaire',
        status: 'active',
        name: 'health',
        version: '1.0.0',
        language: 'en',
        item: [
          {
            linkId: 'pregnant',
            type: 'string',
            text: 'Are you pregnant?',
            extension: [variable('gender', { topic: TOPIC, scope: 'latest' })],
            modifierExtension: [
              {
                url: EnableWhenExpressionExtension,
                valueExpression: { language: 'text/fhirpath', expression },
              },
            ],
          },
        ],
      },
    });
    expect(questionnaire.questions).toHaveLength(1);
    const [question] = questionnaire.questions;
    expect(question.enableWhenExpression).toBe(expression);
    expect(question.itemVariables).toEqual([
      { name: 'gender', topic: 'socialNetwork', scope: TopicScope.latest },
    ]);
    // Enable Behavior is derived from the expression; enableWhen stays empty since the expression encodes the dependency
    expect(question.enableBehavior).toBe('all');
    expect(question.enableWhen).toEqual([]);
  });

  describe('Enable Behavior of an expression dependency', () => {
    const parseExpression = (expression: string) =>
      parseFHIRQuestionnaire({
        en: {
          resourceType: 'Questionnaire',
          status: 'active',
          name: 'health',
          version: '1.0.0',
          language: 'en',
          item: [
            {
              linkId: 'dependent',
              type: 'string',
              text: 'Dependent',
              extension: [variable('a', { question: 'a' }), variable('b', { question: 'b' })],
              modifierExtension: [
                {
                  url: EnableWhenExpressionExtension,
                  valueExpression: { language: 'text/fhirpath', expression },
                },
              ],
            },
          ],
        },
      }).questions[0];

    it("is 'any' for conditions joined with or", () => {
      expect(parseExpression("(%a contains 'x') or (%b.exists())").enableBehavior).toBe('any');
    });

    it("is 'all' for conditions joined with and", () => {
      expect(parseExpression("(%a contains 'x') and (%b.exists())").enableBehavior).toBe('all');
    });

    it("falls back to 'all' for a custom expression that does not decompile", () => {
      expect(parseExpression("%a contains 'x' or %b.exists() and %a.empty()").enableBehavior).toBe('all');
    });
  });

  it('keeps the item codes of the template', () => {
    const questionnaire = parseFHIRQuestionnaire({
      en: {
        resourceType: 'Questionnaire',
        status: 'active',
        name: 'eq-5d-5l',
        version: '1.0.0',
        language: 'en',
        item: [
          {
            linkId: 'health-today',
            type: 'decimal',
            text: 'How good or bad is your health TODAY?',
            code: [
              { system: 'http://snomed.info/sct', code: '736534008' },
              { system: 'http://loinc.org', code: '89257-6', display: 'EQ VAS' },
              { system: 'http://snomed.info/sct' },
            ],
          },
          { linkId: 'uncoded', type: 'decimal', text: 'No code' },
        ],
      },
    });
    expect(questionnaire.questions.map((q) => q.code)).toEqual([
      [
        { system: 'http://snomed.info/sct', code: '736534008' },
        { system: 'http://loinc.org', code: '89257-6', display: 'EQ VAS' },
      ],
      [],
    ]);
  });
});

describe('group items (content-step covers)', () => {
  it('recurses into a group item and converts its image/description children', () => {
    const questionnaire = parseFHIRQuestionnaire({
      en: {
        resourceType: 'Questionnaire',
        status: 'active',
        name: 'with-cover',
        version: '1.0.0',
        language: 'en',
        item: [
          {
            linkId: 'intro-cover',
            type: 'group',
            text: 'Welcome',
            item: [
              {
                linkId: 'intro-cover-image',
                type: 'display',
                text: '',
                extension: [
                  {
                    url: ImageExtension,
                    valueAttachment: {
                      url: 'https://static.example.com/programs/my-program/images/abc123',
                      title: 'Welcome image',
                    },
                  },
                ],
              },
              { linkId: 'intro-cover-description', type: 'display', text: 'Thanks for joining.' },
            ],
          },
        ],
      },
    });

    expect(questionnaire.questions).toHaveLength(1);
    const [cover] = questionnaire.questions;
    expect(cover.inputType).toBe(inputTypeFromJSON('group'));
    expect(cover.items).toHaveLength(2);

    const [image, description] = cover.items;
    expect(image.linkId).toBe('intro-cover-image');
    expect(image.inputType).toBe(inputTypeFromJSON('display'));
    expect(image.image).toEqual({ src: 'abc123', alt: 'Welcome image', data: '', contentType: '' });
    expect(description.linkId).toBe('intro-cover-description');
    expect(description.text).toEqual({ en: 'Thanks for joining.' });
  });

  it('returns an empty items array for a group item with no children', () => {
    const questionnaire = parseFHIRQuestionnaire({
      en: {
        resourceType: 'Questionnaire',
        status: 'active',
        name: 'empty-group',
        version: '1.0.0',
        language: 'en',
        item: [{ linkId: 'empty', type: 'group', text: '' }],
      },
    });
    expect(questionnaire.questions[0].items).toEqual([]);
  });
});

describe('native type resolution (parseInputType)', () => {
  const questionnaireWithItem = (item: fhir5.QuestionnaireItem) =>
    parseFHIRQuestionnaire({
      en: {
        resourceType: 'Questionnaire',
        status: 'active',
        name: 'q',
        version: '1.0.0',
        language: 'en',
        item: [item],
      },
    });

  it.each([
    ['integer', { type: 'integer' as const, text: 'How many?' }, 'integer'],
    ['decimal', { type: 'decimal' as const, text: 'How much?' }, 'decimal'],
    ['text', { type: 'text' as const, text: 'Tell us more' }, 'text'],
    ['date', { type: 'date' as const, text: 'When?' }, 'date'],
    ['string', { type: 'string' as const, text: 'Name?' }, 'string'],
  ] as const)('resolves a native %s type', (_, itemOverrides, expected) => {
    const questionnaire = questionnaireWithItem({ linkId: 'q1', ...itemOverrides });
    expect(questionnaire.questions[0].inputType).toBe(inputTypeFromJSON(expected));
  });

  it('resolves a repeating string as list', () => {
    const questionnaire = questionnaireWithItem({
      linkId: 'q1',
      type: 'string',
      text: 'Hobbies',
      repeats: true,
    });
    expect(questionnaire.questions[0].inputType).toBe(inputTypeFromJSON('list'));
  });

  it('resolves coding as single_select', () => {
    const questionnaire = questionnaireWithItem({ linkId: 'q1', type: 'coding', text: 'Pick one' });
    expect(questionnaire.questions[0].inputType).toBe(inputTypeFromJSON('single_select'));
  });

  it('resolves repeating coding as multi_select', () => {
    const questionnaire = questionnaireWithItem({
      linkId: 'q1',
      type: 'coding',
      text: 'Pick some',
      repeats: true,
    });
    expect(questionnaire.questions[0].inputType).toBe(inputTypeFromJSON('multi_select'));
  });

  it('resolves coding with the ISO country ValueSet as country', () => {
    const questionnaire = questionnaireWithItem({
      linkId: 'q1',
      type: 'coding',
      text: 'Country',
      answerValueSet: CountryValueSet,
    });
    expect(questionnaire.questions[0].inputType).toBe(inputTypeFromJSON('country'));
  });

  it('drops a question with an unsupported native type entirely', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const questionnaire = questionnaireWithItem({ linkId: 'q1', type: 'boolean', text: 'Agree?' });
    expect(questionnaire.questions).toEqual([]);
    expect(warn).toHaveBeenCalledWith('Question has an unsupported type:', 'boolean');
    warn.mockRestore();
  });
});

describe('matrix questions', () => {
  it('resolves matrix rows as matrix_item, with the shared column answerset only on the parent', () => {
    const questionnaire = parseFHIRQuestionnaire({
      en: {
        resourceType: 'Questionnaire',
        status: 'active',
        name: 'matrix-q',
        version: '1.0.0',
        language: 'en',
        contained: [
          {
            resourceType: 'ValueSet',
            id: 'columns',
            status: 'active',
            compose: { include: [{ system: 'http://example.com/cs' }] },
            expansion: {
              identifier: 'urn:uuid:1',
              timestamp: '2026-01-01T00:00:00Z',
              contains: [
                { code: 'agree', display: 'Agree' },
                { code: 'disagree', display: 'Disagree' },
              ],
            },
          },
        ],
        item: [
          {
            linkId: 'matrix-q',
            type: 'group',
            text: 'Rate the following',
            answerValueSet: '#columns',
            extension: [
              {
                url: QItemControlDefinition,
                valueCodeableConcept: { coding: [{ code: 'matrix' }] },
              },
            ],
            item: [
              { linkId: 'row-1', type: 'coding', text: 'Row one', answerValueSet: '#columns' },
              { linkId: 'row-2', type: 'coding', text: 'Row two', answerValueSet: '#columns' },
            ],
          },
        ],
      },
    });

    expect(questionnaire.questions).toHaveLength(1);
    const [matrix] = questionnaire.questions;
    expect(matrix.inputType).toBe(inputTypeFromJSON('matrix'));
    expect(matrix.answerset?.answers.map((a) => a.code)).toEqual(['agree', 'disagree']);
    expect(matrix.items).toHaveLength(2);

    for (const row of matrix.items) {
      expect(row.inputType).toBe(inputTypeFromJSON('matrix_item'));
      expect(row.answerset).toBeUndefined();
    }
    expect(matrix.items.map((r) => r.linkId)).toEqual(['row-1', 'row-2']);
  });
});

describe('required', () => {
  const parse = (item: fhir5.QuestionnaireItem[], contained: fhir5.ValueSet[] = []) =>
    parseFHIRQuestionnaire({
      en: {
        resourceType: 'Questionnaire',
        status: 'active',
        name: 'required-q',
        version: '1.0.0',
        language: 'en',
        contained,
        item,
      },
    }).questions;

  it('drops required on groups and display items but keeps it on their children', () => {
    const [group] = parse([
      {
        linkId: 'group',
        type: 'group',
        text: 'Group',
        required: true,
        item: [
          { linkId: 'display', type: 'display', text: 'Display', required: true },
          { linkId: 'string', type: 'string', text: 'String', required: true },
        ],
      },
    ]);

    expect(group.required).toBe(false);
    expect(group.items.map((q) => [q.linkId, q.required])).toEqual([
      ['display', false],
      ['string', true],
    ]);
  });

  it('keeps required on a matrix and its rows', () => {
    const [matrix] = parse(
      [
        {
          linkId: 'matrix',
          type: 'group',
          text: 'Matrix',
          required: true,
          answerValueSet: '#columns',
          extension: [
            { url: QItemControlDefinition, valueCodeableConcept: { coding: [{ code: 'matrix' }] } },
          ],
          item: [{ linkId: 'row', type: 'coding', text: 'Row', required: true, answerValueSet: '#columns' }],
        },
      ],
      [
        {
          resourceType: 'ValueSet',
          id: 'columns',
          status: 'active',
          compose: { include: [{ system: 'http://example.com/cs' }] },
          expansion: { timestamp: '2026-01-01T00:00:00Z', contains: [{ code: 'a', display: 'A' }] },
        },
      ]
    );

    expect(matrix.required).toBe(true);
    expect(matrix.items[0].required).toBe(true);
  });
});

describe('answerset order', () => {
  const questionnaireWithAnswerset = (extension?: fhir5.Extension[]) =>
    parseFHIRQuestionnaire({
      en: {
        resourceType: 'Questionnaire',
        status: 'active',
        name: 'q',
        version: '1.0.0',
        language: 'en',
        contained: [
          {
            resourceType: 'ValueSet',
            id: 'answers',
            status: 'active',
            extension,
            compose: { include: [{ system: 'http://example.com/cs' }] },
            expansion: {
              identifier: 'urn:uuid:2',
              timestamp: '2026-01-01T00:00:00Z',
              contains: [{ code: 'a', display: 'A' }],
            },
          },
        ],
        item: [{ linkId: 'q1', type: 'coding', text: 'Pick one', answerValueSet: '#answers' }],
      },
    });

  it('reads the sorting extension from the contained ValueSet', () => {
    const questionnaire = questionnaireWithAnswerset([
      { url: ValuesetSortingExtension, valueCode: 'alphabetical' },
    ]);
    expect(questionnaire.questions[0].answerset?.order).toBe('alphabetical');
  });

  it("defaults to 'default' when no sorting extension is present", () => {
    const questionnaire = questionnaireWithAnswerset(undefined);
    expect(questionnaire.questions[0].answerset?.order).toBe('default');
  });
});

describe('answerset system', () => {
  const BASE = 'https://collect.example.org/fhir/r5/program';
  const questionnaireWithSystem = (system: string, url = `${BASE}/Questionnaire/q`) =>
    parseFHIRQuestionnaire({
      en: {
        resourceType: 'Questionnaire',
        status: 'active',
        name: 'q',
        version: '1.0.0',
        language: 'en',
        url,
        contained: [
          {
            resourceType: 'ValueSet',
            id: '0',
            status: 'active',
            compose: { include: [{ system }] },
            expansion: {
              identifier: 'urn:uuid:3',
              timestamp: '2026-01-01T00:00:00Z',
              contains: [{ code: 'a', display: 'A', system }],
            },
          },
        ],
        item: [{ linkId: 'q1', type: 'coding', text: 'Pick one', answerValueSet: '#0' }],
      },
    });

  it('drops the Default Code System derived from the questionnaire URL', () => {
    const questionnaire = questionnaireWithSystem(`${BASE}/CodeSystem/q/q1`);
    expect(questionnaire.questions[0].answerset).toBeDefined();
    expect(questionnaire.questions[0].answerset?.system).toBeUndefined();
  });

  it('keeps a custom system', () => {
    const questionnaire = questionnaireWithSystem('http://example.org/CodeSystem/mood');
    expect(questionnaire.questions[0].answerset?.system).toBe('http://example.org/CodeSystem/mood');
  });

  it("keeps a system that is the default of another question's link id", () => {
    const questionnaire = questionnaireWithSystem(`${BASE}/CodeSystem/q/other`);
    expect(questionnaire.questions[0].answerset?.system).toBe(`${BASE}/CodeSystem/q/other`);
  });

  it('keeps the system when the questionnaire has no URL', () => {
    const questionnaire = questionnaireWithSystem(`${BASE}/CodeSystem/q/q1`, '');
    expect(questionnaire.questions[0].answerset?.system).toBe(`${BASE}/CodeSystem/q/q1`);
  });
});
