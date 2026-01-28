import { RecursiveKeyOf, TranslatedString } from '.';
import { DEVICE_MOVELLA_PAYLOAD_MODES } from '../devices';
import { TaskFrequency, TaskReminder } from './survey';

export type RoutineTimes = { [key: string]: Date | null };

// ### Routine
// Properties | Required | Type | Description
export type Routine = {
  // name | true | string | Primary identifier. Assumption: survey and routine names are collectively unique
  name: string;
  // programName | true | string | The name of the program the routine belongs to
  programName: string;
  // frequency | true | [TaskFrequency](#TaskFrequency) | Defines in which frequency the questionnaire occurs
  frequency: TaskFrequency;
  // content | true | [RoutineContent](#RoutineContent) | Defines the texts, images and icons that need to be displayed for the routine
  content: RoutineContent;
  // devices | true | string[] | Lists the devices used in the routine
  devices: ProgramDevice[];
  // duration | ISO 8601 duration String | Defines the duration of the routine
  duration?: string;
  // reminder | false | [TaskReminder](#TaskReminder) | Defines if and when a reminder should be sent for the task (only for one-time and recurring tasks)
  reminder?: TaskReminder;
  // publishedAt | true | ISO 8601 date with timezone | Date the routine was published.
  publishedAt?: string;
};

// #### ProgramDevice
// Properties | Required | Type | Description
export type ProgramDevice = {
  // type | true | [ProgramDeviceType](#ProgramDeviceType) | Device identifier
  type: ProgramDeviceType;
  // dataTypes | true | [ProgramDevicesDataType](#ProgramDevicesDataType)[] | List of data types to collect
  dataTypes: ProgramDevicesDataType[];
  // labels | true | [ProgramDevicesLabel](#ProgramDevicesLabel)[] | List of labels
  labels?: ProgramDevicesLabel[];
  // outputRate | false | number | Sampling rate in hz
  outputRate?: number;
  // sensorDelay | false | number | Sensor delay as per Android constants https://developer.android.com/reference/android/hardware/SensorManager#SENSOR_DELAY_FASTEST
  sensorDelay?: number;
  // streamingMode | false | string | Device specific streaming mode to use for data types
  streamingMode?: DEVICE_MOVELLA_PAYLOAD_MODES;
  // clientID | false | string | ClientID required to request data via API
  clientID?: string;
  // clientTarget | false | `prod`/`sandbox` | Identifier which URL set to use for API communication. Defaults to prod if unset
  clientTarget?: ProgramClientTarget;
};

export type ProgramDeviceType =
  | 'EstimoteUWB'
  | 'DEXCOM'
  | 'DOT'
  | 'H10'
  | 'OH1'
  | 'INTERNAL'
  | 'FITBIT'
  | 'GalaxyWatch6'
  | 'PixelWatch1'
  | 'AppleHealth';

export type ProgramDevicesDataType =
  | 'distance'
  | 'rssi'
  | 'eulerAngles'
  | 'freeAcceleration'
  | 'angularVelocity'
  | 'heartRate'
  | 'hrv'
  | 'internal_gyroscope'
  | 'internal_accelerometer'
  | 'internal_magnetometer'
  | 'internal_beacon_sensing'
  | 'acceleration'
  | 'angularSpeed'
  | 'magneticField'
  | 'stepsTotal'
  | 'caloriesTotal'
  | 'distanceTotal'
  | 'floorsTotal'
  | 'absoluteElevation'
  | 'positiveElevationTotal'
  | 'negativeElevationTotal'
  | 'minSpeed'
  | 'maxSpeed'
  | 'averageSpeed'
  | 'speed'
  | 'vo2max'
  | 'motionCadence'
  | 'minMotionCadence'
  | 'maxMotionCadence'
  | 'averageMotionCadence'
  | 'dailySteps'
  | 'dailyDistance'
  | 'dailyCalories'
  | 'dailyFloors'
  | 'activityDetection'
  | 'egvs'
  | 'samsungSdkHeartRate'
  | 'interbeatInterval'
  | 'skinTemperature'
  | 'ppgGreen'
  | 'ppgRed'
  | 'ppgInfrared'
  | 'ecg'
  | 'spo2'
  | 'steps'
  | 'calories'
  | 'sleep'
  | 'respiratoryRate'
  | 'stepCount'
  | 'walkingAndRunningDistance'
  | 'activeEnergy'
  | 'sleepAnalysis';

export type ProgramDevicesLabel = { name: string } & TranslatedString;

export type ExtendedProgramDevicesDataType =
  | ProgramDevicesDataType
  | `${ProgramDevicesDataType}@${string}`;

export type ProgramClientTarget = 'prod' | 'sandbox';

// #### RoutineContent
// Properties | Required | Type | Description
export type RoutineContent = {
  // default | true | object | Default values for routine texts and images
  default: {
    // default.title | true | {[language]: text} | Routine title in available languages
    title: TranslatedString;
  };
  // steps | true | [RoutineContentStep[]](#RoutineContentStep) | Routine steps
  steps?: RoutineContentStep[];
};

// #### RoutineContentStep
// Properties | Required | Type | Description
export type RoutineContentStep = {
  // title | true | {[language]: text} | Step title in available languages
  title: TranslatedString;
  // blocks | true | {image?: text, instructions: {[language]: text}} | Step blocks including image and instructions
  blocks: {
    image?: string;
    instructions: TranslatedString;
  }[];
};

export type RoutineContentPath = RecursiveKeyOf<RoutineContent>;
