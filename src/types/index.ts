export * from './consent';
export * from './display';
export * from './questionnaireScore';
export * from './program';
export * from './questionnaireResponse';
export * from './recording';
export * from './recordingSignal';
export * from './researchSubject';
export * from './routine';
export * from './survey';
export * from './tag';

export type TranslatedString = { [key: string]: string };

/**
 * Extract all nested keys of a type
 */
export type RecursiveKeyOf<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<TObj[TKey], `${TKey}`>;
}[keyof TObj & (string | number)];

type RecursiveKeyOfInner<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<TObj[TKey], `.${TKey}`>;
}[keyof TObj & (string | number)];

type RecursiveKeyOfHandleValue<TValue, Text extends string> = TValue extends Function
  ? never
  : TValue extends any[]
    ? Text | `${Text}.${number}` | `${Text}.${number}${RecursiveKeyOfInner<TValue[0]>}`
    : TValue extends object
      ? Text | `${Text}${RecursiveKeyOfInner<TValue>}`
      : Text;
