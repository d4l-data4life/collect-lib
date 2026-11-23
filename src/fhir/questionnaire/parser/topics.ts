import {
  ItemVariableNameUrl,
  ItemVariableQuestionUrl,
  ItemVariableScopeUrl,
  ItemVariableTopicUrl,
  TopicInputScopeUrl,
  TopicInputTopicUrl,
} from '../../constants';
import { isValidTopicCanonical, topicIdFromCanonical } from '../../topic-id';
import { ItemVariable, TopicInput, TopicScope, topicScopeFromJSON } from '@d4l/grpc-modules/research-pillars';

// name plus exactly one source (topic canonical + scope, or local linkId); undefined if malformed.
export const parseItemVariable = (extension: fhir5.Extension): ItemVariable | undefined => {
  const sub = (url: string) => extension.extension?.find((e) => e.url === url);
  const name = sub(ItemVariableNameUrl)?.valueString;
  const topicCanonical = sub(ItemVariableTopicUrl)?.valueCanonical;
  const question = sub(ItemVariableQuestionUrl)?.valueString;
  if (!name || (topicCanonical === undefined) === (question === undefined)) {
    return undefined;
  }
  if (question !== undefined) {
    return { name, question };
  }
  const scopeCode = sub(ItemVariableScopeUrl)?.valueCode;
  if (!topicCanonical || !isValidTopicCanonical(topicCanonical) || !scopeCode) {
    return undefined;
  }
  const scope = topicScopeFromJSON(scopeCode);
  if (scope === TopicScope.UNRECOGNIZED) {
    return undefined;
  }
  return { name, topic: topicIdFromCanonical(topicCanonical), scope };
};

/**
 * Parse a complex questionnaire-item-input extension into a TopicInput. Returns
 * undefined when the topic is missing/malformed or the scope is unrecognized —
 * mirroring phoenix's parser, which requires both a valid topic and a scope.
 */
export const parseTopicInput = (extension: fhir5.Extension): TopicInput | undefined => {
  const topicCanonical = extension.extension?.find((e) => e.url === TopicInputTopicUrl)?.valueCanonical;
  const scopeCode = extension.extension?.find((e) => e.url === TopicInputScopeUrl)?.valueCode;
  if (!topicCanonical || !isValidTopicCanonical(topicCanonical) || !scopeCode) {
    return undefined;
  }
  const scope = topicScopeFromJSON(scopeCode);
  if (scope === TopicScope.UNRECOGNIZED) {
    return undefined;
  }
  return { topic: topicIdFromCanonical(topicCanonical), scope };
};
