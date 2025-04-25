import { RecursiveKeyOf, TranslatedString } from '.';

export type ConsentTimes = { [key: string]: Date | null };

export type Consent = {
  name: string;
  programName: string;
  version: number;
  text: TranslatedString;
  title: TranslatedString;
  published?: string;
};

export type ConsentPath = RecursiveKeyOf<Consent>;
