import { QuestionInputType, ReponseValue, QuestionnaireResponse } from '../types/questionnaireResponse';
import { CustomExtensionDate, CustomExtensionStudyName } from './constants';

export const generateFHIRResponse = ({
  programName,
  effectiveDate,
  language,
  questionnaire,
  createdAt,
  status,
  answers,
}: QuestionnaireResponse): fhir5.QuestionnaireResponse => {
  const extension: fhir5.Extension[] = [
    { url: CustomExtensionStudyName, valueString: programName },
    ...(effectiveDate ? [{ url: CustomExtensionDate, valueDate: effectiveDate }] : []),
  ];

  return {
    resourceType: 'QuestionnaireResponse',
    language: language,
    questionnaire: `${questionnaire.url}|${questionnaire.version}`,
    extension,
    authored: createdAt,
    status,
    item: answers.map((answer) => toQuestionnaireResponseItem(answer)),
  };
};

export const toQuestionnaireResponseItem = (answer: {
  id: string;
  type: QuestionInputType;
  response: ReponseValue | ReponseValue[];
  text: string;
}): fhir5.QuestionnaireResponseItem => {
  const response = answer.response;
  if (Array.isArray(response)) {
    return {
      linkId: answer.id,
      text: answer.text,
      answer: response.map((r: ReponseValue) => ({
        valueCoding: { system: r.system, code: r.value, display: r?.display },
      })),
    };
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
