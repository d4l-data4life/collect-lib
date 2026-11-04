import {
  CountryValueSet,
  EnableWhenExpressionExtension,
  ImageExtension,
  Iso3166CodeSystem,
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
} from './constants';
import { isValidTopicCanonical, topicIdFromCanonical } from './topic-id';
import {
  Answerset,
  Coding,
  InputType,
  inputTypeFromJSON,
  inputTypeToJSON,
  ItemVariable,
  operatorFromJSON,
  Question,
  QuestionImage,
  Questionnaire,
  TopicInput,
  TopicScope,
  topicScopeFromJSON,
} from '@d4l/grpc-modules/research-pillars';

export type QuestionnaireMap = {
  [language: string]: fhir5.Questionnaire;
};

export const fhirToQuestionnaire = (fhirQuestionnaires: QuestionnaireMap): Questionnaire => {
  const first = fhirQuestionnaires[Object.keys(fhirQuestionnaires)[0]];
  if (!first.name || !first.version) {
    throw new Error('FHIR Questionnaire is missing required fields (name, version)');
  }
  return {
    name: first.name,
    title: Object.keys(fhirQuestionnaires).reduce((acc, el) => {
      return { ...acc, [el]: fhirQuestionnaires[el].title };
    }, {}),
    version: first.version,
    questions: extractQuestionsFromFHIR(fhirQuestionnaires),
  };
};

const extractQuestionsFromFHIR = (fhirQuestionnaires: QuestionnaireMap): Question[] => {
  const languages = Object.keys(fhirQuestionnaires);
  const valueSets: { [key: string]: { [language: string]: fhir5.ValueSet } } = {};
  const questionItems: { [key: string]: { [language: string]: fhir5.QuestionnaireItem } } = {};
  for (const language of languages) {
    if (fhirQuestionnaires[language]?.contained) {
      for (const valueset of fhirQuestionnaires[language].contained as fhir5.ValueSet[]) {
        if (valueset.id) {
          valueSets[valueset.id] = { ...valueSets[valueset.id], [language]: valueset };
        }
      }
    }
    if (fhirQuestionnaires[language]?.item) {
      for (const item of fhirQuestionnaires[language].item) {
        questionItems[item.linkId] = { ...questionItems[item.linkId], [language]: item };
      }
    }
  }
  const answerSets = valueSetsToAnswerSets(languages, valueSets);

  const questions: Question[] = [];
  const q = fhirQuestionnaires[languages[0]];
  if (q.item) {
    for (const qItem of q.item) {
      const question = convertQuestion(languages, answerSets, questionItems[qItem.linkId]);
      if (question) {
        questions.push(question);
      }
    }
  }
  return questions;
};

const valueSetsToAnswerSets = (
  languages: string[],
  valueSets: {
    [key: string]: { [language: string]: fhir5.ValueSet };
  }
): { [key: string]: Answerset } => {
  const answerSets: { [key: string]: Answerset } = {};
  for (const valueSet of Object.keys(valueSets)) {
    const fhirValueSet = valueSets[valueSet][languages[0]];
    const valuesetSystem = fhirValueSet.compose?.include?.[0].system;
    const order = fhirValueSet.extension?.find((e) => e.url === ValuesetSortingExtension)?.valueCode;
    answerSets[valueSet] = { order: order || 'default', answers: [], system: valuesetSystem };
    const contains = fhirValueSet.expansion?.contains;
    if (contains) {
      for (const answer of contains) {
        answerSets[valueSet].answers.push({
          code: answer.code!,
          languages: languages.reduce(
            (acc, lang) => ({
              ...acc,
              [lang]: valueSets[valueSet][lang].expansion?.contains?.find((el) => el.code == answer.code)
                ?.display,
            }),
            {}
          ),
        });
      }
    }
  }
  return answerSets;
};

const convertQuestion = (
  languages: string[],
  answerSets: { [key: string]: Answerset },
  questionItems: { [language: string]: fhir5.QuestionnaireItem },
  isMatrixRow = false
): Question | undefined => {
  const questionItem = questionItems[languages[0]];
  // Parse question type
  let questionInputType = parseInputType(questionItem, isMatrixRow);

  // Parse extensions
  const {
    config: questionConfig,
    inputType: parsedQuestionInputType,
    prepopulate,
    input,
    output,
    itemVariables,
    image,
  } = parseExtensions(languages, questionItems);
  // Update question type from the extensions
  if (parsedQuestionInputType) {
    questionInputType = parsedQuestionInputType;
  }

  if (questionInputType === undefined || questionInputType === InputType.UNRECOGNIZED) {
    console.warn(`Question ${questionItem.linkId} has an invalid type. It will be ignored.`);
    return undefined;
  }

  // Check questionItem.type not questionInputType because questionInputType can be overwritten by extensions (happens for matrix)
  const isGroupShaped = questionItem.type === 'group';

  const question: Question = {
    linkId: questionItem.linkId,
    itemVariables,
    text: languages.reduce((acc, lang) => ({ ...acc, [lang]: questionItems[lang].text }), {}),
    inputType: inputTypeFromJSON(questionInputType),
    required: !!questionItem.required,
    enableWhen: [],
    items: isGroupShaped
      ? convertChildQuestions(languages, answerSets, questionItems, questionInputType === InputType.matrix)
      : [],
    ...(Object.keys(questionConfig).length && { config: questionConfig }),
    prepopulate: prepopulate ?? [],
    input,
    output,
    code: parseCodes(questionItem),
    ...(image && { image }),
  };

  if (questionItem.enableWhen !== undefined) {
    question.enableWhen = questionItem.enableWhen.map((ew) => ({
      question: ew.question,
      operator: stringToOperator(ew.operator),
      answerCoding: ew.answerCoding?.code,
      answerDate: ew.answerDate,
      answerDecimal: ew.answerDecimal ?? ew.answerInteger,
    }));
    question.enableBehavior = questionItem.enableBehavior ?? 'all';
  }

  // An expression dependency (topic-sourced or time-relative conditions) is carried as an SDC
  // modifierExtension; research-pillars emits no enableBehavior for it, so mark the question as having
  // a dependency the way Studio does (the all/any behavior itself is encoded in the expression).
  const enableWhenExpression = parseEnableWhenExpression(questionItem);
  if (enableWhenExpression) {
    question.enableWhenExpression = enableWhenExpression;
    question.enableBehavior ??= 'all';
  }

// Rows carry their own answerValueSet reference in FHIR, but we only attach the answerset on the parent Question
  if (!isMatrixRow && questionItem.answerValueSet && questionItem.answerValueSet !== CountryValueSet) {
    question.answerset = answerSets[questionItem.answerValueSet.replace('#', '')];
    if (!question.answerset) {
      console.warn(
        `The answer value set for question ${questionItem.linkId} cannot be found. The question will be ignored.`
      );
      return undefined;
    }
  }

  return question;
};


const convertChildQuestions = (
  languages: string[],
  answerSets: { [key: string]: Answerset },
  questionItems: { [language: string]: fhir5.QuestionnaireItem },
  isMatrixRow: boolean
): Question[] => {
  const first = questionItems[languages[0]];
  if (!first.item) {
    return [];
  }
  const childItemsByLinkId: { [linkId: string]: { [language: string]: fhir5.QuestionnaireItem } } = {};
  for (const language of languages) {
    for (const child of questionItems[language]?.item || []) {
      childItemsByLinkId[child.linkId] = { ...childItemsByLinkId[child.linkId], [language]: child };
    }
  }
  const children: Question[] = [];
  for (const child of first.item) {
    const converted = convertQuestion(languages, answerSets, childItemsByLinkId[child.linkId], isMatrixRow);
    if (converted) {
      children.push(converted);
    }
  }
  return children;
};

// FHIR types whose name matches the InputType enum member directly
const DEFAULT_TYPE_NAMES = new Set(['display', 'text', 'integer', 'decimal', 'date', 'group']);

const parseInputType = (questionItem: fhir5.QuestionnaireItem, isMatrixRow: boolean): InputType => {
  // isMatrixRow sets the type of each child element to `matrix_item`, since the rows themselves do not have an extension
  if (isMatrixRow) {
    return InputType.matrix_item;
  }
  const { type, repeats, answerValueSet } = questionItem;
  switch (type) {
    case 'coding':
      if (answerValueSet === CountryValueSet) {
        return InputType.country;
      }
      return repeats ? InputType.multi_select : InputType.single_select;
    case 'string':
      return repeats ? InputType.list : InputType.string;
    default:
      if (type && DEFAULT_TYPE_NAMES.has(type)) {
        return inputTypeFromJSON(type);
      }
      console.warn('Question has an unsupported type:', type);
      return InputType.UNRECOGNIZED;
  }
};

type PostalCodeCountrySource =
  | { fromItem: string; fixedCountry?: never }
  | { fromItem?: never; fixedCountry: { system: string; code: string } };

type QuestionConfig = {
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
  let questionConfig: QuestionConfig = {};
  let questionInputType: InputType | undefined;
  let questionImage: QuestionImage | undefined;
  const prepopulate: Set<string> = new Set();
  const output: Set<string> = new Set();
  const input: TopicInput[] = [];
  const itemVariables: ItemVariable[] = [];
  const placeholders: string[] = [];
  const firstItem = questionItems[languages[0]];
  const extensions = firstItem?.extension || [];

  // maxLength is a native FHIR field, not an extension
  if ((firstItem?.type === 'string' || firstItem?.type === 'text') && firstItem.maxLength !== undefined) {
    questionConfig = { ...questionConfig, maxLength: firstItem.maxLength };
  }

  for (const extension of extensions) {
    switch (extension.url) {
      case MaxValueExtension:
        questionConfig = {
          ...questionConfig,
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
        questionConfig = {
          ...questionConfig,
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
          questionConfig = { ...questionConfig, minLength: extension.valueInteger };
        }
        break;
      case SliderMinLabelExtension:
        questionConfig = {
          ...questionConfig,
          minLabel: extractLocalizedString(languages, questionItems, SliderMinLabelExtension),
        };
        break;
      case SliderMaxLabelExtension:
        questionConfig = {
          ...questionConfig,
          maxLabel: extractLocalizedString(languages, questionItems, SliderMaxLabelExtension),
        };
        break;
      case SliderStepSizeExtension:
        questionConfig = {
          ...questionConfig,
          step: extension.valueDecimal,
        };
        break;
      case SliderInputLabel:
        questionConfig = {
          ...questionConfig,
          inputLabel: extractLocalizedString(languages, questionItems, SliderInputLabel),
        };
        break;
      case SliderOrientationExtension: {
        const orientation = extension.valueCode;
        if (orientation === 'horizontal' || orientation === 'vertical') {
          questionConfig = { ...questionConfig, orientation };
        } else {
          console.warn(`Unsupported slider orientation: ${orientation}. It will be ignored.`);
        }
        break;
      }
      case QItemControlDefinition:
        questionInputType = inputTypeFromJSON(extension.valueCodeableConcept?.coding?.[0].code);
        break;
      case RelativeMinValueExtension:
        questionConfig = {
          ...questionConfig,
          min: extension.valueString,
        };
        break;
      case RelativeMaxValueExtension:
        questionConfig = {
          ...questionConfig,
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
        const countrySource = parsePostalCodeCountrySource(extension);
        if (countrySource) {
          questionConfig = { ...questionConfig, countrySource };
        } else {
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
    questionConfig = { ...questionConfig, placeholders };
  }
  return {
    config: questionConfig,
    inputType: questionInputType,
    prepopulate: prepopulate.size > 0 ? Array.from(prepopulate) : undefined,
    input,
    output: Array.from(output),
    itemVariables,
    image: questionImage,
  };
};

// Mirrors ParsePostalCodeExtensions (research-pillars/pkg/fhir/questionConfig.go)
const parsePostalCodeCountrySource = (extension: fhir5.Extension): PostalCodeCountrySource | undefined => {
  for (const sub of extension.extension ?? []) {
    if (sub.url === PostalCodeFromItemUrl && sub.valueString) {
      return { fromItem: sub.valueString };
    }
    if (sub.url === PostalCodeFixedCountryUrl && sub.valueCoding?.code) {
      return {
        fixedCountry: {
          system: sub.valueCoding.system ?? Iso3166CodeSystem,
          code: sub.valueCoding.code,
        },
      };
    }
  }
  return undefined;
};

// name plus exactly one source (topic canonical + scope, or local linkId); undefined if malformed.
const parseItemVariable = (extension: fhir5.Extension): ItemVariable | undefined => {
  const sub = (url: string) => extension.extension?.find((e) => e.url === url);
  const name = sub(ItemVariableNameUrl)?.valueString;
  const topicCanonical = sub(ItemVariableTopicUrl)?.valueCanonical;
  const question = sub(ItemVariableQuestionUrl)?.valueString;
  if (!name || (topicCanonical === undefined) === (question === undefined)) {
    return undefined;
  }
  if (question !== undefined) {
    return { name, question };
  }
  const scopeCode = sub(ItemVariableScopeUrl)?.valueCode;
  if (!topicCanonical || !isValidTopicCanonical(topicCanonical) || !scopeCode) {
    return undefined;
  }
  const scope = topicScopeFromJSON(scopeCode);
  if (scope === TopicScope.UNRECOGNIZED) {
    return undefined;
  }
  return { name, topic: topicIdFromCanonical(topicCanonical), scope };
};

/** The terminology codings (e.g. SNOMED) of the item, skipping entries without a system or code. */
const parseCodes = (questionItem: fhir5.QuestionnaireItem): Coding[] =>
  (questionItem.code ?? [])
    .filter((coding) => coding.system && coding.code)
    .map(({ system, code, display }) => ({ system: system!, code: code!, ...(display && { display }) }));

/** The FHIRPath of an SDC enableWhenExpression modifierExtension, if the item carries one. */
const parseEnableWhenExpression = (questionItem: fhir5.QuestionnaireItem): string | undefined => {
  const extension = questionItem.modifierExtension?.find((e) => e.url === EnableWhenExpressionExtension);
  const expression = extension?.valueExpression?.expression;
  return expression && expression.trim() !== '' ? expression : undefined;
};

/**
 * Parse a complex questionnaire-item-input extension into a TopicInput. Returns
 * undefined when the topic is missing/malformed or the scope is unrecognized —
 * mirroring phoenix's parser, which requires both a valid topic and a scope.
 */
const parseTopicInput = (extension: fhir5.Extension): TopicInput | undefined => {
  const topicCanonical = extension.extension?.find((e) => e.url === TopicInputTopicUrl)?.valueCanonical;
  const scopeCode = extension.extension?.find((e) => e.url === TopicInputScopeUrl)?.valueCode;
  if (!topicCanonical || !isValidTopicCanonical(topicCanonical) || !scopeCode) {
    return undefined;
  }
  const scope = topicScopeFromJSON(scopeCode);
  if (scope === TopicScope.UNRECOGNIZED) {
    return undefined;
  }
  return { topic: topicIdFromCanonical(topicCanonical), scope };
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

function stringToOperator(op: string): number {
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
