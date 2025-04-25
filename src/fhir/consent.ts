import { Buffer } from 'buffer/';
import { Consent } from '../types';
import { ConsentNameSystem, ConsentVersionSystem } from './constants';

export function generateFHIRConsent(
  id: string,
  consent: Consent,
  decision: fhir5.Consent['decision'],
  start: string,
  end?: string
): fhir5.Consent {
  return {
    id,
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
}
