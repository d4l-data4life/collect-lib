import {
  Answerset,
  InputType,
  inputTypeFromJSON,
  Question,
  Questionnaire,
} from '@d4l/grpc-modules/research-pillars';
import { Iso3166CodeSystem } from '../../constants';

/** Everything Generation reads besides the Questionnaire Definition; no environment or clock access. */
export type GenerationOptions = {
  baseUrl: string;
  staticUrl: string;
  programName: string;
  languages: string[];
  /** Questionnaire.date, e.g. the definition's change date. */
  date: string;
  /** ValueSet.expansion.timestamp, also part of the expansion identifier. */
  timestamp: string;
};

/** The URLs and lookups shared by every item of one definition. */
export type GenerationContext = {
  staticUrl: string;
  programName: string;
  timestamp: string;
  questionnaireUrl: string;
  /** `<base>/<program>/<resource>/<questionnaire>/<id>`, e.g. a Default Code System. */
  questionUrl: (resource: 'ValueSet' | 'CodeSystem', id: string) => string;
  topicUrl: (topic: string) => string;
  /** The Effective Code System of the answer set a condition on `linkId` refers to. */
  effectiveCodeSystem: (linkId: string) => string;
  /** The URL of the contained value set of the answer set on `linkId`. */
  valueSetUrl: (linkId: string) => string;
};

export const createContext = (definition: Questionnaire, options: GenerationOptions): GenerationContext => {
  const { baseUrl, programName } = options;
  const questionUrl = (resource: string, id: string) =>
    `${baseUrl}/${programName}/${resource}/${definition.name}/${id}`;

  // Matrix rows answer with their parent's answer set, so a condition on a row uses the parent's system.
  // Country questions answer from CountryValueSet, whose codes are in the ISO 3166 code system.
  const systems = new Map<string, string>();
  const collect = (questions: Question[], parent?: Question) => {
    for (const question of questions) {
      const owner = parent ?? question;
      const isCountry = inputTypeFromJSON(owner.inputType) === InputType.country;
      const system = isCountry
        ? Iso3166CodeSystem
        : owner.answerset?.system || questionUrl('CodeSystem', owner.linkId);
      systems.set(question.linkId, system);
      const isMatrix = inputTypeFromJSON(question.inputType) === InputType.matrix;
      collect(question.items ?? [], isMatrix ? question : undefined);
    }
  };
  collect(definition.questions);
  const valueSetUrls = deriveValueSetUrls(definition.questions, questionUrl);

  return {
    staticUrl: options.staticUrl,
    programName,
    timestamp: options.timestamp,
    questionnaireUrl: `${baseUrl}/${programName}/Questionnaire/${definition.name}`,
    questionUrl,
    topicUrl: (topic) => `${baseUrl}/${programName}/topic/${topic}`,
    effectiveCodeSystem: (linkId) => systems.get(linkId) ?? questionUrl('CodeSystem', linkId),
    valueSetUrl: (linkId) => valueSetUrls.get(linkId) ?? questionUrl('ValueSet', linkId),
  };
};

/**
 * Value set URLs per link id, one per distinct answer set: questions share a URL, and so one
 * contained value set, only when their answer sets agree in system, order, codes and translations.
 * A set with a custom system is named after the system's last path segment when no other set and no
 * link id claims that name; any other set is named after the first link id using it.
 * Link ids are unique, so distinct sets never share a URL.
 */
const deriveValueSetUrls = (
  questions: Question[],
  questionUrl: (resource: 'ValueSet' | 'CodeSystem', id: string) => string
): Map<string, string> => {
  const linkIds = new Set<string>();
  const sets = new Map<string, { linkIds: string[]; segment?: string }>();
  const walk = (items: Question[]) => {
    for (const question of items) {
      linkIds.add(question.linkId);
      const { answerset } = question;
      if (answerset && inputTypeFromJSON(question.inputType) !== InputType.country) {
        const key = answerSetKey(answerset, questionUrl('CodeSystem', question.linkId));
        const set = sets.get(key) ?? {
          linkIds: [],
          segment: answerset.system?.split('/').pop() || undefined,
        };
        set.linkIds.push(question.linkId);
        sets.set(key, set);
      }
      walk(question.items ?? []);
    }
  };
  walk(questions);

  const claims = new Map<string, number>();
  for (const { segment } of sets.values()) {
    if (segment) {
      claims.set(segment, (claims.get(segment) ?? 0) + 1);
    }
  }
  const urls = new Map<string, string>();
  for (const set of sets.values()) {
    const ownsSegment = set.segment && claims.get(set.segment) === 1 && !linkIds.has(set.segment);
    const url = questionUrl('ValueSet', ownsSegment ? set.segment! : set.linkIds[0]);
    set.linkIds.forEach((linkId) => urls.set(linkId, url));
  }
  return urls;
};

/**
 * Identity of an answer set's contained value set.
 * A set without a system gets its question's Default Code System, so it is never shared.
 */
const answerSetKey = (answerset: Answerset, defaultCodeSystem: string): string =>
  JSON.stringify([
    answerset.system || defaultCodeSystem,
    answerset.order || 'default',
    answerset.answers.map(({ code, languages }) => [code, Object.entries(languages ?? {}).sort()]),
  ]);
