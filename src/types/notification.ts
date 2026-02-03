// ### Notification
// Properties | Required | Type | Description
export interface Notification {
  // name | true | string | Primary identifier
  name: string;
  // programName | true | string | The name of the program the notification belongs to
  programName: string;
  // recipients | false | string[] | List of subject Ids to receive the notification. Empty means everyone.
  recipients?: string[];
  // notificationKey | true | string | notification key to be displayed by device
  notificationKey: string;
  // createdAt | false | string | ISO Date string when the notification was created
  createdAt?: string;
  // updatedAt | false | string | ISO Date string when the notification was last updated
  updatedAt?: string;
  // sentAt | false | string | ISO Date string when the notification was sent
  sentAt?: string;
}

export type ResponseTimes = { [key: string]: Date | null };
