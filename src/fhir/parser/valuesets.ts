import { ValuesetSortingExtension } from '../constants';
import { Answerset } from '@d4l/grpc-modules/research-pillars';

export const valueSetsToAnswerSets = (
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
