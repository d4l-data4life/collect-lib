/**
 * Topic-id helpers shared by next-research-studio (authoring) and phoenix
 * (runtime). A topic's canonical URL ends in an identifier-safe id
 * (^[A-Za-z_][A-Za-z0-9_]*$): constrained from the start so ids stay stable,
 * are safe as index/map keys, and never need renaming or migration.
 *
 * NOTE: research-pillars (Go, pkg/fhir) mirrors `topicIdFromCanonical`; it
 * cannot import this module, so keep the two in sync by hand.
 */
export const TOPIC_ID_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** True if the id is identifier-safe (see {@link TOPIC_ID_PATTERN}). */
export const isValidTopicId = (id: string): boolean => TOPIC_ID_PATTERN.test(id);

/** The topic id — the last path segment of a topic canonical URL. */
export const topicIdFromCanonical = (canonical: string): string =>
  canonical.substring(canonical.lastIndexOf('/') + 1);

/** True if the canonical's id segment is identifier-safe. */
export const isValidTopicCanonical = (canonical: string): boolean =>
  isValidTopicId(topicIdFromCanonical(canonical));

/**
 * The FHIR `valueCode` strings for a topic input's scope, in proto-enum order
 * (session=0, latest=1, all=2). These are the wire contract: they must equal
 * the grpc-modules `TopicScope` enum's JSON names
 */
export const TOPIC_SCOPE_CODES = ['session', 'latest', 'all'] as const;

export type TopicScopeCode = (typeof TOPIC_SCOPE_CODES)[number];

/** True if `code` is a recognized topic scope valueCode. */
export const isValidTopicScope = (code: string): code is TopicScopeCode =>
  (TOPIC_SCOPE_CODES as readonly string[]).includes(code);
