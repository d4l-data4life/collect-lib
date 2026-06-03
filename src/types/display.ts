import {
  ProgramDevicesDataType,
  ProgramDeviceType,
  RecursiveKeyOf,
  TranslatedString,
} from './index';
import { TaskFrequency } from './survey';

// ### Display
// Properties | Required | Type | Description
export type Display = {
  // name | true | string | Primary identifier. Assumption: survey and display names are collectively unique
  name: string;
  // programName | true | string | The name of the program the display belongs to
  programName: string;
  // displayType | true | 'report' / 'recommendation' | The type of the display (report or recommendation)
  displayType: DisplayType;
  // frequency | true | [TaskFrequency](#TaskFrequency) | Defines in which frequency the questionnaire occurs
  frequency: TaskFrequency;
  // content | true | [DisplayContent](#DisplayContent) | Defines the texts, images and icons that need to be displayed for the display
  content: DisplayContent;
  // charts | false | { [key in ProgramDeviceType]?: ProgramDevicesDataType[] } | List of devices and their data types that are relevant for the display
  charts?: { [key in ProgramDeviceType]?: ProgramDevicesDataType[] };
  // publishedAt | false | ISO 8601 date with timezone | Date the display was published.
  publishedAt?: string;
  // withheld | false | boolean | If true, the survey will not be published yet
  withheld?: boolean;
};

export type DisplayType = 'report' | 'recommendation' | 'end-of-participation';

// #### DisplayContent
// Properties | Required | Type | Description
export type DisplayContent = {
  // default | true | object | Default values for display texts and images
  default: {
    // default.title | true | {[language]: text} | Display title in available languages
    title: TranslatedString;
    // default.message | true | {[language]: text} | Display message in available languages
    message: TranslatedString;
  };
  // blocks | false | [ContentBlock](#ContentBlock)[] | Content blocks for the display
  blocks?: ContentBlock[];
};

// #### ContentBlock
// Properties | Required | Type | Description
export type ContentBlock = {
  // image | false | object | Optional image for the content block
  image?: {
    // image.src | true | string | Image source URL
    src: string;
    // image.alt | false | {[language]: text} | Alt text for the image in available languages
    alt?: TranslatedString;
  };
  // text | true | {[language]: text} | Block text in available languages
  text: TranslatedString;
};

export type DisplayContentPath = RecursiveKeyOf<DisplayContent>;

export interface SeenDisplay {
  /**
   * The name of the triggering display step
   */
  name: string;
  /**
   * Date at which the display was seen by the user
   */
  seenAt: string;
  /**
   * Date the display was created
   */
  effectiveDate: string;
  /**
   * The app language at the point at which the user has seen the display
   */
  lng: string;
  /**
   * The type of display
   */
  displayType: DisplayType;
  /**
   * If applicable, the content of the display
   */
  content?: DisplayContent;
}

export type DisplayPath = RecursiveKeyOf<Display>;
