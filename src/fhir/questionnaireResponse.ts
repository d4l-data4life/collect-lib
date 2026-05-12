import {
  QuestionInputType,
  QuestionnaireResponse,
  ResponseValue,
} from '../types/questionnaireResponse';
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

export const toQuestionnaireResponseItem = (answer: {
  id: string;
  type: QuestionInputType;
  response: ResponseValue | ResponseValue[];
  text: string;
}): fhir5.QuestionnaireResponseItem => {
  const response = answer.response;

  if (Array.isArray(response)) {
    switch (answer.type) {
      case 'multi-select':
        return {
          linkId: answer.id,
          text: answer.text,
          answer: response.map((r: ResponseValue) => ({
            valueCoding: { system: r.system, code: r.value, display: r?.display },
          })),
        };
      case 'list':
        return {
          linkId: answer.id,
          text: answer.text,
          answer: response.map((r: ResponseValue) => ({
            valueString: r.value,
          })),
        };
      default:
        return {
          linkId: answer.id,
        };
    }
  }

  switch (answer.type) {
    case 'date':
      return {
        linkId: answer.id,
        text: answer.text,
        answer: [{ valueDate: String(response.value) }],
      };
    case 'decimal':
      return {
        linkId: answer.id,
        text: answer.text,
        answer: [{ valueDecimal: Number(response.value) }],
      };
    case 'year':
      return {
        linkId: answer.id,
        text: answer.text,
        answer: [{ valueDate: String(response.value) }],
      };
    case 'single-select':
    case 'country':
      return {
        linkId: answer.id,
        text: answer.text,
        answer: [
          {
            valueCoding: {
              system: response.system,
              code: response?.value!,
              display: response?.display!,
            },
          },
        ],
      };
    case 'scale-ordinal':
    case 'scale-numeric':
      return {
        linkId: answer.id,
        text: answer.text,
        answer: [{ valueInteger: Number(response.value) }],
      };
    case 'string':
    case 'text':
    case 'geo-location':
      return {
        linkId: answer.id,
        text: answer.text,
        answer: [{ valueString: response.value }],
      };
    default:
      return {
        linkId: answer.id,
      };
  }
};
