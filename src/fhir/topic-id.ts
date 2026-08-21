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
