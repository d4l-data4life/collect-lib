import { Answerset } from '@d4l/grpc-modules/research-pillars';
import { v5 as uuidv5 } from 'uuid';
import { ValuesetSortingExtension } from '../../constants';
import { GenerationContext } from './context';
import { optional } from './extensions';
import { PUBLISHER_NAME, PUBLISHER_URL } from './questionnaire';

/**
 * The contained value set of an answer set, written with its Effective Code System.
 * Its URL comes from the context, which gives questions with identical answer sets the same one.
 */
export const generateValueSet = (
  answerset: Answerset,
  linkId: string,
  language: string,
  ctx: GenerationContext
): fhir5.ValueSet => {
  const url = ctx.valueSetUrl(linkId);
  const system = answerset.system || ctx.questionUrl('CodeSystem', linkId);
  const sorted = answerset.order && answerset.order !== 'default';

  return {
    resourceType: 'ValueSet',
    language,
    ...(sorted && { extension: [{ url: ValuesetSortingExtension, valueCode: answerset.order }] }),
    name: linkId,
    url,
    status: 'active',
    publisher: PUBLISHER_NAME,
    contact: [{ name: PUBLISHER_NAME, telecom: [{ system: 'url', value: PUBLISHER_URL }] }],
    compose: { include: [{ system, concept: answerset.answers.map(({ code }) => ({ code })) }] },
    expansion: {
      identifier: uuidv5([url, language, ctx.timestamp].join('|'), uuidv5.URL),
      timestamp: ctx.timestamp,
      parameter: [{ name: 'displayLanguage', valueCode: language }],
      contains: answerset.answers.map(({ code, languages }) => ({
        system,
        ...optional('code', code),
        ...optional('display', languages[language]),
      })),
    },
  };
};
