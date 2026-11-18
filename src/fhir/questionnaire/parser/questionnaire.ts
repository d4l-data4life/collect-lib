import { Question, Questionnaire } from '@d4l/grpc-modules/research-pillars';
import { convertQuestion } from './questions';
import { defaultCodeSystemFactory, valueSetsToAnswerSets } from './valuesets';

export type QuestionnaireMap = {
  [language: string]: fhir5.Questionnaire;
};

export const parseFHIRQuestionnaire = (fhirQuestionnaires: QuestionnaireMap): Questionnaire => {
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
  const defaultCodeSystem = defaultCodeSystemFactory(fhirQuestionnaires[languages[0]].url);

  const questions: Question[] = [];
  const q = fhirQuestionnaires[languages[0]];
  if (!q.item) {
    return [];
  }
  for (const qItem of q.item) {
    const question = convertQuestion(languages, answerSets, defaultCodeSystem, questionItems[qItem.linkId]);
    if (question) {
      questions.push(question);
    }
  }
  return questions;
};
