import {
  EnableWhenExpressionExtension,
  ImageExtension,
  Iso3166CodeSystem,
  MaxValueExtension,
  MinLengthExtension,
  MinValueExtension,
  PlaceholderExtension,
  PostalCodeCountrySourceExtension,
  PostalCodeFixedCountryUrl,
  PostalCodeFromItemUrl,
  PrepopulateExtension,
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
} from '../../constants';
import { isValidTopicCanonical, topicIdFromCanonical } from '../../topic-id';
import { parseItemVariable, parseTopicInput } from './topics';
import {
  Coding,
  InputType,
  inputTypeFromJSON,
  ItemVariable,
  operatorFromJSON,
  QuestionImage,
  TopicInput,
} from '@d4l/grpc-modules/research-pillars';

export type PostalCodeCountrySource =
  | { fromItem: string; fixedCountry?: never }
  | { fromItem?: never; fixedCountry: { system: string; code: string } };

export type QuestionConfig = {
  max?: number | string;
  min?: number | string;
  minLabel?: Record<string, string>;
  maxLabel?: Record<string, string>;
  step?: number;
  orientation?: 'horizontal' | 'vertical';
  inputLabel?: Record<string, string>;
  minLength?: number;
  maxLength?: number;
  countrySource?: PostalCodeCountrySource;
  placeholders?: string[];
};

export const parseExtensions = (
  languages: string[],
  questionItems: { [language: string]: fhir5.QuestionnaireItem }
): {
  config: QuestionConfig;
  inputType: InputType | undefined;
  prepopulate: string[] | undefined;
  input: TopicInput[];
  output: string[];
  itemVariables: ItemVariable[];
  image: QuestionImage | undefined;
} => {
  let config: QuestionConfig = {};
  let questionInputType: InputType | undefined;
  let questionImage: QuestionImage | undefined;
  const prepopulate: Set<string> = new Set();
  const output: Set<string> = new Set();
  const input: TopicInput[] = [];
  const itemVariables: ItemVariable[] = [];
  const placeholders: string[] = [];
  const countrySources: PostalCodeCountrySource[] = [];
  const firstItem = questionItems[languages[0]];
  const extensions = firstItem?.extension || [];

  // maxLength is a native FHIR field, not an extension
  if ((firstItem?.type === 'string' || firstItem?.type === 'text') && firstItem.maxLength !== undefined) {
    config = { ...config, maxLength: firstItem.maxLength };
  }

  for (const extension of extensions) {
    switch (extension.url) {
      case MaxValueExtension:
        config = {
          ...config,
          max: getValueFrom([
            extension.valueDate,
            extension.valueDateTime,
            extension.valueTime,
            extension.valueInstant,
            extension.valueDecimal,
            extension.valueInteger,
          ]),
        };
        break;
      case MinValueExtension:
        config = {
          ...config,
          min: getValueFrom([
            extension.valueDate,
            extension.valueDateTime,
            extension.valueTime,
            extension.valueInstant,
            extension.valueDecimal,
            extension.valueInteger,
          ]),
        };
        break;
      case MinLengthExtension:
        if (extension.valueInteger !== undefined) {
          config = { ...config, minLength: extension.valueInteger };
        }
        break;
      case SliderMinLabelExtension:
        config = {
          ...config,
          minLabel: extractLocalizedString(languages, questionItems, SliderMinLabelExtension),
        };
        break;
      case SliderMaxLabelExtension:
        config = {
          ...config,
          maxLabel: extractLocalizedString(languages, questionItems, SliderMaxLabelExtension),
        };
        break;
      case SliderStepSizeExtension:
        config = {
          ...config,
          step: extension.valueDecimal,
        };
        break;
      case SliderInputLabel:
        config = {
          ...config,
          inputLabel: extractLocalizedString(languages, questionItems, SliderInputLabel),
        };
        break;
      case SliderOrientationExtension: {
        const orientation = extension.valueCode;
        if (orientation === 'horizontal' || orientation === 'vertical') {
          config = { ...config, orientation };
        } else {
          console.warn(`Unsupported slider orientation: ${orientation}. It will be ignored.`);
        }
        break;
      }
      case QItemControlDefinition:
        questionInputType = inputTypeFromJSON(extension.valueCodeableConcept?.coding?.[0].code);
        break;
      case RelativeMinValueExtension:
        config = {
          ...config,
          min: extension.valueString,
        };
        break;
      case RelativeMaxValueExtension:
        config = {
          ...config,
          max: extension.valueString,
        };
        break;
      // LEGACY(prepopulate) [HUB-6797]: remove this case (and the prepopulate import, accumulator, and return field) when prepopulate is retired.
      case PrepopulateExtension:
        if (extension.valueString) {
          prepopulate.add(extension.valueString);
        }
        break;
      case QuestionnaireItemOutputExtension:
        if (extension.valueCanonical && isValidTopicCanonical(extension.valueCanonical)) {
          output.add(topicIdFromCanonical(extension.valueCanonical));
        } else {
          console.warn(
            `Ignoring malformed topic output extension on ${questionItems[languages[0]]?.linkId}.`
          );
        }
        break;
      case QuestionnaireItemInputExtension: {
        const topicInput = parseTopicInput(extension);
        if (topicInput) {
          input.push(topicInput);
        } else {
          console.warn(`Ignoring malformed topic input extension on ${questionItems[languages[0]]?.linkId}.`);
        }
        break;
      }
      case QuestionnaireItemVariableExtension: {
        const variable = parseItemVariable(extension);
        if (variable) {
          itemVariables.push(variable);
        } else {
          console.warn(
            `Ignoring malformed item variable extension on ${questionItems[languages[0]]?.linkId}.`
          );
        }
        break;
      }
      case ImageExtension:
        if (extension.valueAttachment?.url) {
          questionImage = {
            src: extension.valueAttachment.url.split('/').pop() || '',
            alt: extension.valueAttachment.title || '',
            data: '',
            contentType: '',
          };
        } else if (extension.valueAttachment?.data) {
          questionImage = {
            src: '',
            alt: extension.valueAttachment.title || '',
            data: extension.valueAttachment.data,
            contentType: extension.valueAttachment.contentType || '',
          };
        }
        break;
      case PostalCodeCountrySourceExtension: {
        const sources = parsePostalCodeCountrySources(extension);
        countrySources.push(...sources);
        if (sources.length === 0) {
          console.warn(
            `Ignoring malformed postal code country-source extension on ${
              questionItems[languages[0]]?.linkId
            }.`
          );
        }
        break;
      }
      case PlaceholderExtension:
        if (extension.valueString) {
          placeholders.push(extension.valueString);
        }
        break;
      default:
        break;
    }
  }
  if (placeholders.length > 0) {
    config = { ...config, placeholders };
  }
  if (questionInputType === InputType.postal_code) {
    validatePostalCodeCountrySources(languages, questionItems);
  }
  if (countrySources.length > 0) {
    config = { ...config, countrySource: countrySources[0] };
  }
  return {
    config,
    inputType: questionInputType,
    prepopulate: prepopulate.size > 0 ? Array.from(prepopulate) : undefined,
    input,
    output: Array.from(output),
    itemVariables,
    image: questionImage,
  };
};

/**
 * A postal code needs exactly one country source (StructureDefinition constraint pccs-1), the same in
 * every language, as in Generation. Parsing reads the config from the first language only, so this
 * checks every language and rejects the item instead of silently picking one.
 */
const validatePostalCodeCountrySources = (
  languages: string[],
  questionItems: { [language: string]: fhir5.QuestionnaireItem }
): void => {
  const linkId = questionItems[languages[0]]?.linkId;
  let first: { language: string; source: PostalCodeCountrySource } | undefined;
  for (const language of languages) {
    const sources = (questionItems[language]?.extension ?? [])
      .filter((extension) => extension.url === PostalCodeCountrySourceExtension)
      .flatMap(parsePostalCodeCountrySources);
    if (sources.length !== 1) {
      throw new Error(
        `Question ${linkId}: postal_code countrySource must include exactly one of fromItem or fixedCountry (language ${language})`
      );
    }
    if (!first) {
      first = { language, source: sources[0] };
    } else if (!sameCountrySource(first.source, sources[0])) {
      throw new Error(
        `Question ${linkId}: postal_code countrySource differs between languages ${first.language} and ${language}`
      );
    }
  }
};

const sameCountrySource = (a: PostalCodeCountrySource, b: PostalCodeCountrySource): boolean =>
  a.fromItem === b.fromItem &&
  a.fixedCountry?.system === b.fixedCountry?.system &&
  a.fixedCountry?.code === b.fixedCountry?.code;

/** Every well-formed country source in a postalcode-country-source extension. */
const parsePostalCodeCountrySources = (extension: fhir5.Extension): PostalCodeCountrySource[] =>
  (extension.extension ?? []).flatMap((sub): PostalCodeCountrySource[] => {
    if (sub.url === PostalCodeFromItemUrl && sub.valueString) {
      return [{ fromItem: sub.valueString }];
    }
    if (sub.url === PostalCodeFixedCountryUrl && sub.valueCoding?.code) {
      return [
        { fixedCountry: { system: sub.valueCoding.system ?? Iso3166CodeSystem, code: sub.valueCoding.code } },
      ];
    }
    return [];
  });

/** The terminology codings (e.g. SNOMED) of the item, skipping entries without a system or code. */
export const parseCodes = (questionItem: fhir5.QuestionnaireItem): Coding[] =>
  (questionItem.code ?? [])
    .filter((coding) => coding.system && coding.code)
    .map(({ system, code, display }) => ({ system: system!, code: code!, ...(display && { display }) }));

/** The FHIRPath of an SDC enableWhenExpression modifierExtension, if the item carries one. */
export const parseEnableWhenExpression = (questionItem: fhir5.QuestionnaireItem): string | undefined => {
  const extension = questionItem.modifierExtension?.find((e) => e.url === EnableWhenExpressionExtension);
  const expression = extension?.valueExpression?.expression;
  return expression && expression.trim() !== '' ? expression : undefined;
};

const extractLocalizedString = (
  languages: string[],
  questionItems: { [language: string]: fhir5.QuestionnaireItem },
  url: string
): Record<string, string> =>
  languages.reduce((localisedExt, lang) => {
    const extension = questionItems[lang]?.extension?.find((e) => e.url === url);
    if (extension?.valueString === undefined) {
      return localisedExt;
    }
    return { ...localisedExt, [lang]: extension.valueString };
  }, {} as Record<string, string>);
const getValueFrom = (values: any[]): any => values.find((value) => value !== undefined);

export function stringToOperator(op: string): number {
  switch (op) {
    case 'exists':
      return operatorFromJSON('exists');
    case '=':
      return operatorFromJSON('eq');
    case '!=':
      return operatorFromJSON('neq');
    case '>':
      return operatorFromJSON('gt');
    case '<':
      return operatorFromJSON('lt');
    case '>=':
      return operatorFromJSON('gteq');
    case '<=':
      return operatorFromJSON('lteq');
    default:
      return operatorFromJSON('eq');
  }
}
