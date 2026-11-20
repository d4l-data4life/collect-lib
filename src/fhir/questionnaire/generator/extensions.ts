import {
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
  PrepopulateExtension,
  QItemControlDefinition,
  CustomQuestionSystem,
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
} from '../../constants';
import type { QuestionConfig } from '../parser/extensions';
import {
  InputType,
  inputTypeToJSON,
  Question,
  topicScopeFromJSON,
  topicScopeToJSON,
} from '@d4l/grpc-modules/research-pillars';
import { GenerationContext } from './context';

// Input types that need the itemControl extension, since their FHIR type alone does not identify them.
const SPECIAL_INPUT_TYPES = new Set<InputType>([
  InputType.year,
  InputType.scale_numeric,
  InputType.scale_ordinal,
  InputType.geo_location,
  InputType.list,
  InputType.country,
  InputType.postal_code,
  InputType.matrix,
  InputType.scale_likert,
]);

// An ISO 8601 duration marks a date bound as relative to the fill date.
const DURATION =
  /^P((-?[0-9]+Y)?(-?[0-9]+M)?(-?[0-9]+W)?(-?[0-9]+D)?(T(-?[0-9]+H)?(-?[0-9]+M)?(-?[0-9]+(\.?[0-9]+)?S)?)?)?$/;

/**
 * The extensions of a question item, plus its native `maxLength`.
 * Mirrors the order research-pillars wrote them in: item control, topics, image, then config.
 */
export const generateExtensions = (
  q: Question,
  inputType: InputType,
  fhirType: string,
  language: string,
  ctx: GenerationContext
): { extensions: fhir5.Extension[]; maxLength?: number } => {
  const extensions: fhir5.Extension[] = [];
  if (SPECIAL_INPUT_TYPES.has(inputType)) {
    extensions.push({
      url: QItemControlDefinition,
      valueCodeableConcept: { coding: [{ system: CustomQuestionSystem, code: inputTypeToJSON(inputType) }] },
    });
  }
  extensions.push(...topicExtensions(q, inputType, ctx));
  if (q.image) {
    extensions.push({
      url: ImageExtension,
      valueAttachment: {
        url: `${ctx.staticUrl}/programs/${ctx.programName}/images/${q.image.src}`,
        ...optional('title', q.image.alt),
      },
    });
  }
  const config = (q.config ?? undefined) as QuestionConfig | undefined;
  if (inputType === InputType.postal_code) {
    extensions.push(...placeholderExtensions(config), postalCodeExtension(q.linkId, config));
    return { extensions };
  }
  extensions.push(...placeholderExtensions(config));
  if (!config) {
    return { extensions };
  }
  switch (fhirType) {
    case 'string':
    case 'text': {
      if (positive(config.minLength)) {
        extensions.push({ url: MinLengthExtension, valueInteger: config.minLength });
      }
      return { extensions, ...(positive(config.maxLength) && { maxLength: config.maxLength }) };
    }
    case 'integer':
    case 'decimal': {
      const valueKey = fhirType === 'integer' ? 'valueInteger' : 'valueDecimal';
      extensions.push(...scaleExtensions(config, language));
      if (config.min !== undefined) {
        extensions.push({ url: MinValueExtension, [valueKey]: config.min });
      }
      if (config.max !== undefined) {
        extensions.push({ url: MaxValueExtension, [valueKey]: config.max });
      }
      return { extensions };
    }
    case 'date':
      extensions.push(
        ...dateBound(config.min, MinValueExtension, RelativeMinValueExtension),
        ...dateBound(config.max, MaxValueExtension, RelativeMaxValueExtension)
      );
      return { extensions };
    default:
      return { extensions };
  }
};

/** The variables an enableWhenExpression references, as questionnaire-item-variable extensions. */
export const itemVariableExtensions = (q: Question, ctx: GenerationContext): fhir5.Extension[] =>
  q.itemVariables.map((variable) => {
    const subs: fhir5.Extension[] = [{ url: ItemVariableNameUrl, ...optional('valueString', variable.name) }];
    if (variable.topic !== undefined) {
      subs.push(
        { url: ItemVariableTopicUrl, ...optional('valueCanonical', ctx.topicUrl(variable.topic)) },
        { url: ItemVariableScopeUrl, valueCode: scopeCode(variable.scope) }
      );
    } else if (variable.question !== undefined) {
      subs.push({ url: ItemVariableQuestionUrl, ...optional('valueString', variable.question) });
    }
    return { url: QuestionnaireItemVariableExtension, extension: subs };
  });

// Coexistence: `input` for new apps and, for list questions, the legacy `prepopulate` for installed
// older apps. LEGACY(prepopulate) [HUB-6797]: drop the prepopulate block when prepopulate is retired.
const topicExtensions = (q: Question, inputType: InputType, ctx: GenerationContext): fhir5.Extension[] => [
  ...q.input.map((input) => ({
    url: QuestionnaireItemInputExtension,
    extension: [
      { url: TopicInputTopicUrl, ...optional('valueCanonical', ctx.topicUrl(input.topic)) },
      { url: TopicInputScopeUrl, valueCode: scopeCode(input.scope) },
    ],
  })),
  ...(inputType === InputType.list
    ? q.prepopulate.map((prepopulate) => ({
        url: PrepopulateExtension,
        ...optional('valueString', prepopulate),
      }))
    : []),
  ...q.output.map((topic) => ({
    url: QuestionnaireItemOutputExtension,
    ...optional('valueCanonical', ctx.topicUrl(topic)),
  })),
];

const placeholderExtensions = (config: QuestionConfig | undefined): fhir5.Extension[] =>
  (config?.placeholders ?? []).map((placeholder) => ({
    url: PlaceholderExtension,
    ...optional('valueString', placeholder),
  }));

const scaleExtensions = (config: QuestionConfig, language: string): fhir5.Extension[] => {
  const extensions: fhir5.Extension[] = [];
  if (config.step !== undefined) {
    extensions.push({ url: SliderStepSizeExtension, valueDecimal: config.step });
  }
  if (config.orientation) {
    extensions.push({ url: SliderOrientationExtension, valueCode: config.orientation });
  }
  const labels: [Record<string, string> | undefined, string][] = [
    [config.inputLabel, SliderInputLabel],
    [config.minLabel, SliderMinLabelExtension],
    [config.maxLabel, SliderMaxLabelExtension],
  ];
  for (const [label, url] of labels) {
    if (label && language in label) {
      extensions.push({ url, ...optional('valueString', label[language]) });
    }
  }
  return extensions;
};

const dateBound = (
  bound: number | string | undefined,
  absoluteUrl: string,
  relativeUrl: string
): fhir5.Extension[] => {
  if (bound === undefined || bound === '') {
    return [];
  }
  const value = String(bound);
  return DURATION.test(value)
    ? [{ url: relativeUrl, valueString: value }]
    : [{ url: absoluteUrl, valueDate: value }];
};

// A postal code needs exactly one country source (StructureDefinition constraint pccs-1).
const postalCodeExtension = (linkId: string, config: QuestionConfig | undefined): fhir5.Extension => {
  const { fromItem, fixedCountry } = config?.countrySource ?? {};
  if (!!fromItem === !!fixedCountry) {
    throw new Error(
      `Question ${linkId}: postal_code countrySource must include exactly one of fromItem or fixedCountry`
    );
  }
  const sub: fhir5.Extension = fromItem
    ? { url: PostalCodeFromItemUrl, valueString: fromItem }
    : { url: PostalCodeFixedCountryUrl, valueCoding: fixedCountry };
  return { url: PostalCodeCountrySourceExtension, extension: [sub] };
};

const scopeCode = (scope: unknown): string => topicScopeToJSON(topicScopeFromJSON(scope ?? 0));

const positive = (value: number | undefined): value is number => value !== undefined && value > 0;

/** `{ [key]: value }` for a non-empty string, `{}` otherwise, so empty values are left out of FHIR. */
export const optional = <K extends string>(key: K, value: string | undefined): { [P in K]?: string } =>
  (value ? { [key]: value } : {}) as { [P in K]?: string };
