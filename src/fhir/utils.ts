import { v4 as uuid } from 'uuid';

export const generateUrn = () => {
  return `urn:uuid:${uuid()}`;
};
