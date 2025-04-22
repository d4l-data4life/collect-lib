import { RecursiveKeyOf, TranslatedString } from '.';

export type ConsentName = 'main' | 'optional';
export type Consent = {
  name: ConsentName;
  programName: string;
  version: number;
  text: TranslatedString;
  title: TranslatedString;
  published?: string;
};

export type ConsentPath = RecursiveKeyOf<Consent>;
