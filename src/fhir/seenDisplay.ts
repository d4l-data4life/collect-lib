import { Buffer } from 'buffer/';
import { DisplayContentPath, SeenDisplay } from '../types';
import { CommunicationTypeSystem } from './constants';
import { capitalizeFirstLetter, getText } from './utils';

export function generateFHIRSeenDisplay(id: string, seenDisplay: SeenDisplay): fhir5.Communication {
  const contentCodeableConcept: fhir5.CodeableConcept = {
    coding: [
      {
        system: CommunicationTypeSystem,
        code: seenDisplay.displayType,
        display: capitalizeFirstLetter(seenDisplay.displayType),
      },
    ],
  };

  const payload: fhir5.Communication['payload'] = seenDisplay.content
    ? [
        {
          contentAttachment: {
            contentType: 'text/plain',
            language: seenDisplay.lng,
            title: getText<DisplayContentPath>(
              seenDisplay.content,
              'default.title',
              seenDisplay.lng
            ),
            data: Buffer.from(
              getText<DisplayContentPath>(seenDisplay.content, 'default.message', seenDisplay.lng)
            ).toString('base64'),
          },
          contentCodeableConcept,
        },
      ]
    : [{ contentCodeableConcept }];

  return {
    id,
    resourceType: 'Communication',
    status: 'completed',
    received: seenDisplay.seenAt,
    basedOn: [{ reference: seenDisplay.name }],
    payload,
  };
}
