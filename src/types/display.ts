import { RecursiveKeyOf, TranslatedString } from './index';
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
  // blocks | false | DisplayContentBlock[] | Content blocks for the display
  blocks?: DisplayContentBlock[];
};

// #### DisplayContentBlock
// Properties | Required | Type | Description
export type DisplayContentBlock = {
  // image | false | string | Optional image for the content block
  image?: string;
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

export type DisplayPath =
  | `content.${DisplayContentPath}`
  | `content.blocks.${number}.image`
  | `content.blocks.${number}.text`
  | 'content.blocks'
  | 'name'
  | `frequency.${keyof TaskFrequency}`
  | 'frequency';
