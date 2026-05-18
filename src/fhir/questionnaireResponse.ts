import { AnswerItem, QuestionnaireResponse, ResponseValue } from '../types/questionnaireResponse';
import {
  CustomExtensionContextValue,
  CustomExtensionDate,
  CustomExtensionStudyName,
} from './constants';

export function generateFHIRResponse(
  id: string,
  {
    programName,
    effectiveDate,
    language,
    questionnaire,
    createdAt,
    status,
    answers,
    context,
  }: QuestionnaireResponse
): fhir5.QuestionnaireResponse {
  const extension: fhir5.Extension[] = [
    { url: CustomExtensionStudyName, valueString: programName },
    ...(effectiveDate ? [{ url: CustomExtensionDate, valueDate: effectiveDate }] : []),
    ...(context
      ? Object.entries(context).map(([key, value]) => ({
          url: CustomExtensionContextValue,
          valueString: `${key}=${value}`,
        }))
      : []),
  ];

  return {
    id,
    resourceType: 'QuestionnaireResponse',
    language: language,
    questionnaire: `${questionnaire.url}|${questionnaire.version}`,
    extension,
    authored: createdAt,
    status,
    item: answers.map((answer) => toQuestionnaireResponseItem(answer)),
  };
}

export const toQuestionnaireResponseItem = (
  answer: AnswerItem
): fhir5.QuestionnaireResponseItem => {
  switch (answer.type) {
    case 'multi-select':
      return {
        linkId: answer.id,
        text: answer.text,
        answer: createArrayAnswer(answer.response, (r) => ({
          valueCoding: { system: r.system, code: r.value, display: r.display },
        })),
      };
    case 'list':
      return {
        linkId: answer.id,
        text: answer.text,
        answer: createArrayAnswer(answer.response, (r) => ({ valueString: r.value })),
      };
    case 'date':
      return {
        linkId: answer.id,
        text: answer.text,
        answer: createAnswer(answer.response, (response) => ({ valueDate: response.value })),
      };
    case 'decimal':
    case 'scale-numeric':
      return {
        linkId: answer.id,
        text: answer.text,
        answer: createAnswer(answer.response, (response) => ({
          valueDecimal: Number(response.value),
        })),
      };
    case 'year':
      return {
        linkId: answer.id,
        text: answer.text,
        answer: createAnswer(answer.response, (response) => ({ valueDate: response.value })),
      };
    case 'matrix':
      return {
        linkId: answer.id,
        text: answer.text,
        item: answer.items.map(toQuestionnaireResponseItem),
      };
    case 'matrix-item':
    case 'single-select':
    case 'country':
      return {
        linkId: answer.id,
        text: answer.text,
        answer: createAnswer(answer.response, (response) => ({
          valueCoding: {
            system: response.system,
            code: response.value,
            display: response.display,
          },
        })),
      };
    case 'scale-ordinal':
    case 'likert-scale':
      return {
        linkId: answer.id,
        text: answer.text,
        answer: createAnswer(answer.response, (response) => ({
          valueInteger: Number(response.value),
        })),
      };
    case 'string':
    case 'text':
    case 'geo-location':
    case 'postal-code':
      return {
        linkId: answer.id,
        text: answer.text,
        answer: createAnswer(answer.response, (response) => ({ valueString: response.value })),
      };
    default:
      return { linkId: answer.id };
  }
};

const createAnswer = <T>(
  response: ResponseValue | undefined,
  mapper: (response: ResponseValue) => T
): T[] => {
  return response !== undefined ? [mapper(response)] : [];
};

const createArrayAnswer = <T>(
  responses: ResponseValue[] | undefined,
  mapper: (r: ResponseValue) => T
): T[] => {
  return responses !== undefined ? responses.map(mapper) : [];
};
