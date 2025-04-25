export type DEVICE_ANNOTATION_DATA_TYPE =
  | 'header'
  | 'flag'
  | 'any'
  | 'timestamp'
  | 'heartRate'
  | 'eulerAngles'
  | 'acceleration'
  | 'freeAcceleration'
  | 'angularSpeed'
  | 'angularVelocity'
  | 'magneticField'
  | 'distance'
  | 'remoteDistance'
  | 'rssi'
  | 'beaconId'
  | 'caloriesTotal'
  | 'distanceTotal'
  | 'speed'
  | 'motionCadence'
  | 'floorsTotal'
  | 'absoluteElevation'
  | 'positiveElevationTotal'
  | 'negativeElevationTotal'
  | 'minSpeed'
  | 'maxSpeed'
  | 'averageSpeed'
  | 'minMotionCadence'
  | 'maxMotionCadence'
  | 'averageMotionCadence'
  | 'vo2max'
  | 'stepsTotal'
  | 'runningStepsTotal'
  | 'dailySteps'
  | 'dailyDistance'
  | 'dailyCalories'
  | 'dailyFloors'
  | 'dailyElevationGain'
  | 'activityDetection'
  | 'egvs'
  | 'ecg'
  | 'spo2'
  | 'samsungSdkHeartRate'
  | 'interbeatInterval'
  | 'ppgGreen'
  | 'ppgRed'
  | 'ppgInfrared'
  // Fitbit types
  | 'skinTemperature'
  | 'sleepLevel'
  | 'duration'
  | 'respiratoryRate'
  | 'hrv'
  | 'calories'
  | 'steps'

  // unused for now but essential not to break the PAMS service compatibility
  | 'normalWalkingEnergyExpenditure'
  | 'normalWalkingEnergyExpenditurePerHour'
  | 'intensityEnergyExpenditure'
  | 'intensityEnergyExpenditurePerHour'
  | 'totalEnergyExpenditurePerHour'
  | 'fatBurned'
  | 'fatBurnedPerHour'
  | 'metabolicEquivalent'
  | 'minimumMetabolicEquivalent'
  | 'maximumMetabolicEquivalent'
  | 'averageMetabolicEquivalent'
  | 'durationOfNormalWalkingEpisodes'
  | 'durationOfIntensityWalkingEpisodes'

  // // Special case for Fitbit -> we configure sleep but it then actually uses sleepLevel and duration
  // | 'sleep'
  // // Special cases for Internal -> we configure which devices
  // | 'internal_gyroscope'
  // | 'internal_accelerometer'
  // | 'internal_magnetometer'
  // | 'internal_beacon_sensing';

export type DEVICE_ANNOTATION_DATA_FORMAT =
  | 'bitmask'
  | 'boolean'
  | 'unsignedInt'
  | 'signedInt'
  | 'signedBigInt'
  | 'float32'
  | 'float64'
  | 'byte';

export type DEVICE_ANNOTATION = DEVICE_ANNOTATION_ITEM[];

export interface DEVICE_ANNOTATION_ITEM {
  type: DEVICE_ANNOTATION_DATA_TYPE;
  size: number;
  format: DEVICE_ANNOTATION_DATA_FORMAT;
  channels?: number;
  channelLabels?: string[];
  littleEndian?: boolean;
  unit?: string;
  note?: string;
}
