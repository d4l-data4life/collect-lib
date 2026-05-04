import { AnswerItem, QuestionnaireResponse } from '../types/questionnaireResponse';
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
        answer: answer.response.map((r) => ({
          valueCoding: { system: r.system, code: r.value, display: r.display },
        })),
      };
    case 'list':
      return {
        linkId: answer.id,
        text: answer.text,
        answer: answer.response.map((r) => ({ valueString: r.value })),
      };
    case 'date':
      return {
        linkId: answer.id,
        text: answer.text,
        answer: [{ valueDate: String(answer.response.value) }],
      };
    case 'decimal':
      return {
        linkId: answer.id,
        text: answer.text,
        answer: [{ valueDecimal: Number(answer.response.value) }],
      };
    case 'year':
      return {
        linkId: answer.id,
        text: answer.text,
        answer: [{ valueDate: String(answer.response.value) }],
      };
    case 'matrix':
      return {
        linkId: answer.id,
        text: answer.text,
        item: answer.items.map(toQuestionnaireResponseItem),
      };
    case 'matrix_item':
    case 'single-select':
    case 'country':
      return {
        linkId: answer.id,
        text: answer.text,
        answer: [
          {
            valueCoding: {
              system: answer.response.system,
              code: answer.response.value,
              display: answer.response.display,
            },
          },
        ],
      };
    case 'scale-ordinal':
    case 'scale-numeric':
      return {
        linkId: answer.id,
        text: answer.text,
        answer: [{ valueInteger: Number(answer.response.value) }],
      };
    case 'string':
    case 'text':
    case 'geo-location':
      return {
        linkId: answer.id,
        text: answer.text,
        answer: [{ valueString: answer.response.value }],
      };
    default:
      return { linkId: answer.id };
  }
};
