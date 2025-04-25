import { Recording, RecordingSignal } from '../types';
import { AppIDNamingSystem, RoutineIsPassiveExtension } from './constants';
import { toFHIRBundleEntries } from './recordingSignal';
import { generateUrn } from './utils';

/**
 * Replaces {{program-name}} and {{fhir-base-host}} templates in the given string
 */
export type StringTemplater = (template: string) => string;

export type RecordingSignalWithId = RecordingSignal & { id: string };

export function generateFHIRRecordingBundle(
  id: string,
  recording: Recording,
  signals: RecordingSignalWithId[],
  stringTemplater: StringTemplater
): fhir5.Bundle {
  const entries = signals.map((signal) => toFHIRBundleEntries(signal)).flat();

  return {
    id,
    resourceType: 'Bundle',
    identifier: {
      system: AppIDNamingSystem,
      value: id,
    },
    type: 'document',
    timestamp: new Date().toISOString(),
    entry: [createFHIRComposition(recording, entries, stringTemplater), ...entries],
  };
}

function createFHIRComposition(
  recording: Recording,
  entries: fhir5.BundleEntry<fhir5.Device | fhir5.Observation | fhir5.DocumentReference>[],
  stringTemplater: StringTemplater
): fhir5.BundleEntry<fhir5.Composition> {
  const tagsAsCompositionEvent: fhir5.CompositionEvent[] = recording.tags?.map((tag) => ({
    detail: [
      {
        concept: {
          coding: [
            {
              system: stringTemplater(
                'http://{{fhir-base-host}}/r5/CodeSystem/{{program-name}}/recording-study-tags'
              ),
              code: tag.code,
              display: tag.labels.en || Object.values(tag.labels)[0],
            },
          ],
        },
      },
    ],
    period: {
      start: tag.start,
      ...(tag.end && { end: tag.end }),
    },
  }));

  const routineAsExtension: fhir5.Extension | undefined = recording.routine
    ? {
        url: 'http://hl7.org/fhir/StructureDefinition/event-basedOn',
        valueReference: {
          identifier: {
            system: stringTemplater(
              'http://{{fhir-base-host}}/identifier/{{program-name}}/user-routine-name'
            ),
            value: recording.routine,
          },
        },
      }
    : undefined;

  const passiveAsExtension: fhir5.Extension = {
    url: RoutineIsPassiveExtension,
    valueBoolean: recording.isPassive,
  };

  const noteAsAnnotation = createNoteAnnotation(
    recording.isSkipped,
    recording.effectiveFrom,
    recording.note
  );

  return {
    fullUrl: generateUrn(),
    resource: {
      resourceType: 'Composition',
      status: recording.isSkipped ? 'cancelled' : 'final',
      type: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '51855-5',
            display: 'Patient Note',
          },
        ],
      },
      author: [{ display: 'unknown' }],
      date: new Date().toISOString(),
      title: 'Complete sensor data recording',
      ...(!!tagsAsCompositionEvent?.length && { event: tagsAsCompositionEvent }),
      section: [
        {
          entry: entries.map((entry) => ({ reference: entry.fullUrl })),
        },
      ],
      ...(noteAsAnnotation && {
        note: [noteAsAnnotation],
      }),
      extension: [passiveAsExtension, ...(routineAsExtension ? [routineAsExtension] : [])],
    },
  };
}

function createNoteAnnotation(
  skipped?: boolean,
  effectiveFrom?: string,
  note?: string
): fhir5.Annotation | undefined {
  if (!note && !skipped) {
    return undefined;
  }

  return {
    text: note ?? '',
    ...(skipped && { time: effectiveFrom }),
  };
}
