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
  | 'samsungSdkAcceleration'
  | 'samsungSdkInterbeatInterval'
  | 'samsungSdkIbiIndex'
  | 'samsungSdkIbiStatus'
  // Fitbit types
  | 'skinTemperature'
  | 'sleepLevel'
  | 'duration'
  | 'respiratoryRate'
  | 'hrv'
  | 'hrvRmssd'
  | 'calories'
  | 'steps'
  | 'activeCalories'
  | 'dailyCaloriesTotal'
  | 'dailyStepsTotal'
  // Google Health types
  | 'floors'
  | 'elevationGain'
  | 'heartRateZone'
  | 'activeZoneMinutes'
  // Apple Health types
  | DEVICE_ANNOTATION_DATA_TYPE_APPLE
  // Oura types
  | 'stress'
  | 'workout'
  | 'tag'
  | 'cardiovascularAge'
  | 'activityLevel'
  | 'batteryLevel'
  | 'skinTemperatureDeviation'
  | 'menstrualCycle'
  | 'menstrualFlow'
  | 'bodyBattery'
  | 'sleepScore'
  | 'bodyComposition'
  | 'bloodPressure'
  // Health Connect types
  | 'sleepStage'
  | 'exerciseType'
  | 'power'
  | 'vo2maxMeasurementMethod'
  // Line Systems (Line Portal) types
  | 'cgm'
  | 'bgm'
  | 'bgmSubType'
  | 'bolus'
  | 'basal'
  | 'basalState'
  | 'insulinOrigin'
  | 'deviceEventType'
  | 'deviceEventSource'
  // Common types for SDK sources
  | 'dataSource'

  // // Special case for Fitbit, Apple health & Health Connect -> we configure sleep but it then actually uses (sleepLevel for fitbit, sleepState for Apple health, sleepStage for Health Connect) and duration
  // | 'sleep'

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
  | 'durationOfIntensityWalkingEpisodes';

// // Special cases for Internal -> we configure which devices
// | 'internal_gyroscope'
// | 'internal_accelerometer'
// | 'internal_magnetometer'
// | 'internal_beacon_sensing';

export type DEVICE_ANNOTATION_DATA_TYPE_APPLE =
  // Quantity & activity
  | 'steps'
  | 'distance'
  | 'heartRate'
  | 'restingHeartRate'
  | 'hrvSdnn'
  | 'respiratoryRate'
  | 'spo2'
  | 'skinTemperature'
  | 'workout'
  | 'stoodDuringHour'
  | 'activitySummary'
  // Sleep (sleepState + shared duration channel)
  | 'sleepState'
  | 'duration'
  // Reproductive health
  | 'menstrualCycle'
  | 'contraceptiveType'
  | 'pregnancyState'
  | 'lactationState';

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
