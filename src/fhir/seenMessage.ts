import { Buffer } from 'buffer/';
import { SeenMessage } from '../types';
import { CommunicationTypeSystem } from './constants';

export function generateFHIRSeenMessage(id: string, seenMessage: SeenMessage): fhir5.Communication {
  const contentCodeableConcept: fhir5.CodeableConcept = {
    coding: [
      {
        system: CommunicationTypeSystem,
        code: 'message',
        display: 'Message',
      },
    ],
  };
  const contentData = seenMessage.blocks ? JSON.stringify(seenMessage.blocks) : '';

  const payload: fhir5.Communication['payload'] = [
    {
      contentAttachment: {
        contentType: 'text/plain',
        language: seenMessage.lng,
        title: seenMessage.subject[seenMessage.lng],
        data: Buffer.from(contentData).toString('base64'),
      },
      contentCodeableConcept,
    },
  ];
  return {
    id,
    resourceType: 'Communication',
    status: 'completed',
    sent: seenMessage.sentAt,
    received: seenMessage.seenAt,
    basedOn: [{ reference: seenMessage.name }],
    payload,
  };
}
