import {
  isValidTopicCanonical,
  isValidTopicId,
  isValidTopicScope,
  TOPIC_SCOPE_CODES,
  topicIdFromCanonical,
} from '../topic-id';

describe('isValidTopicId', () => {
  it('accepts identifier-safe ids', () => {
    expect(isValidTopicId('socialNetwork')).toBe(true);
    expect(isValidTopicId('_private')).toBe(true);
    expect(isValidTopicId('gender_2')).toBe(true);
  });

  it('rejects ids that would break the FHIRPath variable form', () => {
    expect(isValidTopicId('social-network')).toBe(false); // hyphen
    expect(isValidTopicId('2ndContact')).toBe(false); // leading digit
    expect(isValidTopicId('has space')).toBe(false);
    expect(isValidTopicId('')).toBe(false);
  });
});

describe('topicIdFromCanonical', () => {
  it('returns the last path segment', () => {
    expect(topicIdFromCanonical('http://host/r5/puls/topic/socialNetwork')).toBe('socialNetwork');
    expect(topicIdFromCanonical('socialNetwork')).toBe('socialNetwork');
  });
});

describe('isValidTopicCanonical', () => {
  it('validates the id segment of a canonical URL', () => {
    expect(isValidTopicCanonical('http://host/r5/puls/topic/socialNetwork')).toBe(true);
    expect(isValidTopicCanonical('http://host/r5/puls/topic/social-network')).toBe(false);
  });
});

describe('topic scope codes', () => {
  it('lists the scope valueCodes in proto-enum order', () => {
    expect(TOPIC_SCOPE_CODES).toEqual(['session', 'latest', 'all']);
  });

  it('recognizes valid scope codes and rejects others', () => {
    expect(isValidTopicScope('session')).toBe(true);
    expect(isValidTopicScope('latest')).toBe(true);
    expect(isValidTopicScope('all')).toBe(true);
    expect(isValidTopicScope('sometimes')).toBe(false);
    expect(isValidTopicScope('')).toBe(false);
  });
});
