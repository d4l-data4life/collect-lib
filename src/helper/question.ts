export const OTHER_ANSWER_CODE = '#other';

export const getFollowUpQuestionLinkId = (linkId: string): string =>
  `${linkId}${OTHER_ANSWER_CODE}`;
