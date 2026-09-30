export const TRACKING_RESOURCE_TYPE = 'TrackingEvents';

// Categories can be individually enabled per program (see ProgramTracking).
// technical = pipeline/device health, task = task/questionnaire lifecycle,
// engagement = behavioral usage signals.
export type TrackingCategory = 'technical' | 'task' | 'engagement';

export type TrackingEvent = {
  // Client-generated ULID, used as idempotency key per event
  id: string;
  name: string;
  category: TrackingCategory;
  // ISO 8601 timestamp with timezone offset
  timestamp: string;
  properties?: Record<string, unknown>;
};

// One document per uploaded batch. Device/app context lives at document level
// (constant within a batch) and is denormalized onto each event downstream.
// NOTE: the top-level key must be `studyId`, not `study` - the data-receiver
// unmarshals every upload into its FHIR resource struct where `study` is an
// object, and a string there fails the whole upload.
export type TrackingEventsDocument = {
  resourceType: typeof TRACKING_RESOURCE_TYPE;
  studyId: string;
  subjectId?: string;
  appVersion?: string;
  studyVersion?: string;
  os?: string;
  osVersion?: string;
  deviceModel?: string;
  locale?: string;
  timezone?: string;
  events: TrackingEvent[];
};
