import { Buffer } from 'buffer/';
import {
  DEVICE_ANNOTATION_ITEM_UNIX_TIMESTAMP,
  DEVICE_ANNOTATION_TIMESTAMP_SIZE,
} from '../devices';
import { DEVICE_ANNOTATION_ITEM } from '../devices/annotations/types';
import { RecordingSignal } from '../types';
import {
  ANDROID_SENSORS_CONSTANT_NAMES,
  DEVICE_LABEL_CODING,
  DEVICE_OUTPUT_RATE_CODING,
  DEVICE_SENSOR_DELAY_CODING,
  MeasurementTypeSystem,
  SensorIdentifierSystem,
  SensorTypeSystem,
  SIGNAL_DURATION_CODING,
  SignalIDSystem,
} from './constants';
import { RecordingSignalWithId } from './recording';
import { generateUrn } from './utils';

export function toFHIRBundleEntries(
  signal: RecordingSignalWithId
): fhir5.BundleEntry<fhir5.Device | fhir5.Observation | fhir5.DocumentReference>[] {
  const urn = generateUrn();
  const deviceUrn = generateUrn();
  const documentReferenceUrn = generateUrn();

  const documentReference = toFHIRDocumentReference(signal, deviceUrn);
  if (!documentReference) {
    return [];
  }

  return [
    ...deviceToFHIRBundleEntries(signal, deviceUrn),
    {
      fullUrl: urn,
      resource: toFHIRObservation(signal, documentReferenceUrn, deviceUrn),
    },
    {
      fullUrl: documentReferenceUrn,
      resource: documentReference,
    },
  ];
}

function toFHIRDocumentReference(
  signal: RecordingSignal,
  deviceUrn: string
): fhir5.DocumentReference | undefined {
  const { items, annotation, type, deviceKey, deviceFullName, deviceShortName, version } = signal;

  const entrySize = annotation.reduce((sum: number, { size }: { size: number }) => sum + size, 0);

  if (!items) {
    console.error('[Recording Signal] Missing data items for document reference');
    return undefined;
  }

  const data = items.flatMap((item) => {
    const dateBuffer = Buffer.alloc(DEVICE_ANNOTATION_TIMESTAMP_SIZE);
    dateBuffer.writeUIntLE(item.date.getTime(), 0, DEVICE_ANNOTATION_TIMESTAMP_SIZE);
    return [...dateBuffer, ...item.value];
  });

  return {
    resourceType: 'DocumentReference',
    status: 'current',
    author: deviceKey ? [{ reference: deviceUrn }] : [],
    description: `Raw data from ${deviceFullName ?? deviceShortName ?? 'unknown'} device`,
    content: [
      {
        attachment: {
          contentType: 'application/json',
          data: Buffer.from(
            JSON.stringify({
              schemaVersion: version,
              entrySize: entrySize + DEVICE_ANNOTATION_TIMESTAMP_SIZE,
              annotation: [DEVICE_ANNOTATION_ITEM_UNIX_TIMESTAMP, ...annotation],
              type,
            })
          ).toString('base64'),
        },
      },
      {
        attachment: {
          contentType: 'application/octet-stream',
          data: Buffer.from(data).toString('base64'),
        },
      },
    ],
  };
}

function deviceToFHIRBundleEntries(
  signal: RecordingSignal,
  deviceUrn: string
): fhir5.BundleEntry<fhir5.Device | fhir5.Observation>[] {
  const { effectiveFrom, effectiveTo, vendorId } = signal;

  const effectivePeriod: fhir5.Period = {
    start: effectiveFrom,
    end: effectiveTo,
  };

  return [
    deviceToFHIR(signal, vendorId),
    outputRateToFHIR(signal, deviceUrn, effectivePeriod),
    sensorDelayToFHIR(signal, deviceUrn, effectivePeriod)!,
    labelToFHIR(signal, deviceUrn, effectivePeriod)!,
    displayLabelToFHIR(signal, deviceUrn, effectivePeriod),
  ]
    .filter(Boolean)
    .map((resource, index) => ({
      fullUrl: index ? generateUrn() : deviceUrn,
      resource,
    }));
}

function deviceToFHIR(signal: RecordingSignal, serialNumber?: string): fhir5.Device {
  const { deviceFullName, deviceShortName, peripheralId, deviceKey, manufacturerName, type } =
    signal;
  const deviceName = deviceFullName ?? deviceShortName;

  return {
    resourceType: 'Device',
    identifier: [
      {
        system: SensorIdentifierSystem,
        value: peripheralId,
      },
    ],
    manufacturer: manufacturerName,
    serialNumber,
    type: [
      {
        coding: [
          {
            system: SensorTypeSystem,
            code: type,
          },
        ],
      },
    ],
    name: [
      {
        value: deviceKey,
        type: 'registered-name',
      },
      ...(deviceName
        ? [
            {
              value: deviceName,
              type: 'user-friendly-name',
            } as fhir5.DeviceName,
          ]
        : []),
    ],
  };
}

function outputRateToFHIR(
  signal: RecordingSignal,
  reference: string,
  effectivePeriod?: fhir5.Observation['effectivePeriod']
): fhir5.Observation | undefined {
  if (!signal.outputRate) {
    return undefined;
  }

  return {
    resourceType: 'Observation',
    status: 'final',
    code: {
      coding: [DEVICE_OUTPUT_RATE_CODING],
    },
    subject: { reference },
    effectivePeriod,
    valueQuantity: {
      value: signal.outputRate,
      unit: 'Hz',
      system: 'http://unitsofmeasure.org',
      code: 'Hz',
    },
  };
}

function sensorDelayToFHIR(
  signal: RecordingSignal,
  reference: string,
  effectivePeriod?: fhir5.Observation['effectivePeriod']
): fhir5.Observation | undefined {
  if (!signal.sensorDelay) {
    return undefined;
  }

  return {
    resourceType: 'Observation',
    status: 'final',
    code: {
      coding: [DEVICE_SENSOR_DELAY_CODING],
    },
    subject: { reference },
    effectivePeriod,
    valueCodeableConcept: {
      coding: [
        {
          system: 'https://developer.android.com/reference/android/hardware/SensorManager',
          code: ANDROID_SENSORS_CONSTANT_NAMES[signal.sensorDelay],
        },
      ],
    },
  };
}

function labelToFHIR(
  signal: RecordingSignal,
  reference: string,
  effectivePeriod?: fhir5.Observation['effectivePeriod']
): fhir5.Observation | undefined {
  const label = signal.deviceLabel?.name;
  if (!label) {
    return undefined;
  }

  return {
    resourceType: 'Observation',
    status: 'final',
    code: {
      coding: [DEVICE_LABEL_CODING],
    },
    subject: { reference },
    effectivePeriod,
    valueString: label,
  };
}

function displayLabelToFHIR(
  signal: RecordingSignal,
  reference: string,
  effectivePeriod?: fhir5.Observation['effectivePeriod']
): fhir5.Observation | undefined {
  if (!signal.deviceLabel) {
    return undefined;
  }

  let displayLabel = signal.deviceLabel.en;

  if (!displayLabel) {
    return undefined;
  }

  return {
    resourceType: 'Observation',
    status: 'final',
    code: {
      coding: [DEVICE_LABEL_CODING],
    },
    subject: { reference },
    effectivePeriod,
    valueString: displayLabel,
  };
}

function toFHIRObservation(
  signal: RecordingSignalWithId,
  documentReferenceUrn: string,
  deviceUrn: string
): fhir5.Observation {
  const { id, deviceKey, annotation, effectiveFrom, effectiveTo, duration } = signal;

  return {
    resourceType: 'Observation',
    identifier: [
      {
        system: SignalIDSystem,
        value: id,
      },
    ],
    status: 'final',
    code: {
      coding: [
        {
          system: MeasurementTypeSystem,
          code: 'multi_component',
          display: 'Multi-component sensor data captured',
        },
      ],
    },
    effectivePeriod: {
      start: effectiveFrom,
      end: effectiveTo,
    },
    ...(deviceKey ? { device: { reference: deviceUrn } } : {}),
    derivedFrom: [{ reference: documentReferenceUrn }],
    component: [
      {
        code: {
          coding: [SIGNAL_DURATION_CODING],
        },
        valueQuantity: {
          value: duration,
          unit: 'milliseconds',
          system: 'http://unitsofmeasure.org',
          code: 'ms',
        },
      },
      ...[DEVICE_ANNOTATION_ITEM_UNIX_TIMESTAMP, ...annotation]
        .map(({ type }: DEVICE_ANNOTATION_ITEM) => type)
        // .filter(filterDuplicates()) TODO: do we need this?
        .map((dataType) => {
          const segments = dataType
            .split(/([A-Z][^A-Z]*)/)
            .filter(Boolean)
            .map((segment) => segment.toLowerCase());

          return {
            code: {
              coding: [
                {
                  system: MeasurementTypeSystem,
                  code: `has_${segments.join('_')}`,
                  display: `Data of type ${segments.join(' ')} captured`,
                },
              ],
            },
            valueBoolean: true,
          };
        }),
    ],
  };
}
