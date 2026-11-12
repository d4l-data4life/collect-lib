import { CountryValueSet } from '../constants';
import {
  Answerset,
  InputType,
  inputTypeFromJSON,
  Question,
  Questionnaire,
} from '@d4l/grpc-modules/research-pillars';
import { valueSetsToAnswerSets } from './valuesets';
import { parseCodes, parseEnableWhenExpression, parseExtensions, stringToOperator } from './extensions';

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
  if (!q.item) {
    return [];
  }
  for (const qItem of q.item) {
    const question = convertQuestion(languages, answerSets, questionItems[qItem.linkId]);
    if (question) {
      questions.push(question);
    }
  }
  return questions;
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
    config,
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

  const question: Question = {
    linkId: questionItem.linkId,
    itemVariables,
    text: languages.reduce((acc, lang) => ({ ...acc, [lang]: questionItems[lang].text }), {}),
    inputType: inputTypeFromJSON(questionInputType),
    required: !!questionItem.required,
    enableWhen: [],
    // Check questionItem.type not questionInputType because questionInputType can be overwritten by extensions (happens for matrix)
    items:
      questionItem.type === 'group'
        ? convertChildQuestions(languages, answerSets, questionItems, questionInputType === InputType.matrix)
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
  // modifierExtension; research-pillars emits no enableBehavior for it since the all/any behavior
  // is already encoded in the expression itself, and nothing downstream reads it in this case.
  const enableWhenExpression = parseEnableWhenExpression(questionItem);
  if (enableWhenExpression) {
    question.enableWhenExpression = enableWhenExpression;
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
