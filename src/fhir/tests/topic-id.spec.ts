import {
  isValidTopicCanonical,
  isValidTopicId,
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
    expect(topicIdFromCanonical('http://host/r5/topic/puls/socialNetwork')).toBe('socialNetwork');
    expect(topicIdFromCanonical('socialNetwork')).toBe('socialNetwork');
  });
});

describe('isValidTopicCanonical', () => {
  it('validates the id segment of a canonical URL', () => {
    expect(isValidTopicCanonical('http://host/r5/topic/puls/socialNetwork')).toBe(true);
    expect(isValidTopicCanonical('http://host/r5/topic/puls/social-network')).toBe(false);
  });
});
