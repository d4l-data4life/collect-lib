import { ContentBlock, RecursiveKeyOf, TranslatedString } from '.';

// ### Message
// Properties | Required | Type | Description
export interface Message {
  // name | true | string | Primary identifier
  name: string;
  // programName | true | string | The name of the program the message belongs to
  programName: string;
  // recipients | true | string[] | List of subject Ids to receive the message
  recipients: string[];
  // fileName | false | string | File used to upload recipients.
  fileName?: string;
  // subject | true | {[language]: text} | Message subject in available languages
  subject: TranslatedString;
  // blocks | false | [ContentBlock](#ContentBlock)[] | Content blocks for the display
  blocks?: ContentBlock[];
  // createdAt | false | string | ISO Date string when the message was created
  createdAt?: string;
  // updatedAt | false | string | ISO Date string when the message was last updated
  updatedAt?: string;
  // sentAt | false | string | ISO Date string when the message was sent
  sentAt?: string;
  // state | false | 'draft' / 'scheduled' / 'sent' | Lifecycle state, set by the server
  state?: MessageState;
  // scheduledAt | false | string | ISO Date string (UTC) when the message should be released
  scheduledAt?: string;
}

export type MessageState = 'draft' | 'scheduled' | 'sent';

export type MessagePath = RecursiveKeyOf<Message>;

export interface MessageRecipient {
  messageName: string;
  programName: string;
  subjectID: string;
  sentAt?: string;
  pushedAt?: string;
  readAt?: string;
}

export interface SeenMessage {
  name: string;
  programName: string;
  seenAt: string;
  sentAt: string;
  lng: string;
  subject: TranslatedString;
  blocks?: ContentBlock[];
}
