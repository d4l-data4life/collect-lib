import { ConsentNameSystem, ConsentVersionSystem } from './constants';

export type TranslatedString = { [key: string]: string };
export type Consent = {
  name: string;
  programName: string;
  version: number;
  text: TranslatedString;
  title: TranslatedString;
  published?: string;
};

export const generateFHIRConsent = (
  consent: Consent,
  decision: fhir5.Consent['decision'],
  start: string,
  end?: string
): fhir5.Consent => {
  return {
    resourceType: 'Consent',
    identifier: [
      {
        system: ConsentNameSystem,
        value: consent.name,
      },
      {
        system: ConsentVersionSystem,
        value: `${consent.version}`,
      },
    ],
    status: end !== undefined ? 'inactive' : 'active',
    date: start,
    period: {
      start,
      ...(end !== undefined && { end }),
    },
    sourceAttachment: Object.keys(consent.title).map((lng) => ({
      contentType: 'text/plain',
      language: lng,
      title: consent.title[lng],
      data: Buffer.from(consent.text[lng]).toString('base64'),
    })),
    decision,
  };
};
