import {
  Answerset,
  InputType,
  inputTypeFromJSON,
  ItemVariable,
  Question,
  topicScopeToJSON,
} from '@d4l/grpc-modules/research-pillars';
import { CountryValueSet } from '../../constants';
import { decompileEnableWhen, EnableWhenBehavior } from '../../enable-when-conditions';
import { TopicScopeCode } from '../../topic-id';
import { parseCodes, parseEnableWhenExpression, parseExtensions, stringToOperator } from './extensions';
import { DefaultCodeSystem } from './valuesets';

/** The answer set without its system when that system is the question's Default Code System. */
const withoutDefaultCodeSystem = (answerset: Answerset, defaultCodeSystem: string | undefined): Answerset => {
  if (answerset.system === undefined || answerset.system !== defaultCodeSystem) {
    return answerset;
  }
  const { system: _, ...rest } = answerset;
  return rest;
};

export const convertQuestion = (
  languages: string[],
  answerSets: { [key: string]: Answerset },
  defaultCodeSystem: DefaultCodeSystem,
  questionItems: { [language: string]: fhir5.QuestionnaireItem },
  isMatrixRow = false
): Question | undefined => {
  const questionItem = questionItems[languages[0]];
  // Parse question type
  let questionInputType = parseInputType(questionItem, isMatrixRow);

  // Parse extensions
  const {
    config,
    inputType: parsedQuestionInputType,
    prepopulate,
    input,
    output,
    itemVariables,
    image,
  } = parseExtensions(languages, questionItems);
  // Update question type from the extensions
  if (parsedQuestionInputType !== undefined) {
    questionInputType = parsedQuestionInputType;
  }

  if (questionInputType === undefined || questionInputType === InputType.UNRECOGNIZED) {
    console.warn(`Question ${questionItem.linkId} has an invalid type. It will be ignored.`);
    return undefined;
  }

  // FHIR forbids required on display items and Generation never writes it on groups; a matrix is a
  // FHIR group too, but keeps required because it decides whether its rows are checked.
  const canBeRequired = questionInputType !== InputType.display && questionInputType !== InputType.group;

  const question: Question = {
    linkId: questionItem.linkId,
    itemVariables,
    text: languages.reduce((acc, lang) => ({ ...acc, [lang]: questionItems[lang].text }), {}),
    inputType: inputTypeFromJSON(questionInputType),
    required: canBeRequired && !!questionItem.required,
    enableWhen: [],
    // Check questionItem.type not questionInputType because questionInputType can be overwritten by extensions (happens for matrix)
    items:
      questionItem.type === 'group'
        ? convertChildQuestions(
            languages,
            answerSets,
            defaultCodeSystem,
            questionItems,
            questionInputType === InputType.matrix
          )
        : [],
    ...(Object.keys(config).length && { config }),
    prepopulate: prepopulate ?? [],
    input,
    output,
    code: parseCodes(questionItem),
    image,
  };

  if (questionItem.enableWhen !== undefined) {
    question.enableWhen = questionItem.enableWhen.map((ew) => {
      const answerDecimal = ew.answerDecimal ?? ew.answerInteger;
      return {
        question: ew.question,
        operator: stringToOperator(ew.operator),
        ...(ew.answerCoding?.code !== undefined && { answerCoding: ew.answerCoding.code }),
        ...(ew.answerDate !== undefined && { answerDate: ew.answerDate }),
        ...(answerDecimal !== undefined && { answerDecimal }),
      };
    });
    question.enableBehavior = questionItem.enableBehavior ?? 'all';
  }

  // An expression dependency (topic-sourced or time-relative conditions) is carried as an SDC
  // modifierExtension. FHIR has no enableBehavior for it, so it is derived from the expression.
  const enableWhenExpression = parseEnableWhenExpression(questionItem);
  if (enableWhenExpression) {
    question.enableWhenExpression = enableWhenExpression;
    question.enableBehavior = expressionEnableBehavior(itemVariables, enableWhenExpression);
  }

  // Rows carry their own answerValueSet reference in FHIR, but we only attach the answerset on the parent Question
  if (!isMatrixRow && questionItem.answerValueSet && questionItem.answerValueSet !== CountryValueSet) {
    const answerset = answerSets[questionItem.answerValueSet.replace('#', '')];
    if (!answerset) {
      console.warn(
        `The answer value set for question ${questionItem.linkId} cannot be found. The question will be ignored.`
      );
      return undefined;
    }
    question.answerset = withoutDefaultCodeSystem(answerset, defaultCodeSystem(questionItem.linkId));
  }

  return question;
};

/** The behavior a decompiled expression encodes, or 'all' for a custom expression that does not decompile. */
const expressionEnableBehavior = (itemVariables: ItemVariable[], expression: string): EnableWhenBehavior => {
  const variables = itemVariables.map(({ name, question, topic, scope }) => ({
    name,
    question,
    topic,
    scope: scope === undefined ? undefined : (topicScopeToJSON(scope) as TopicScopeCode),
  }));
  return decompileEnableWhen(variables, expression)?.behavior ?? 'all';
};

const convertChildQuestions = (
  languages: string[],
  answerSets: { [key: string]: Answerset },
  defaultCodeSystem: DefaultCodeSystem,
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
    const converted = convertQuestion(
      languages,
      answerSets,
      defaultCodeSystem,
      childItemsByLinkId[child.linkId],
      isMatrixRow
    );
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
