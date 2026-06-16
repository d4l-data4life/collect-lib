# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Add `ScalarAnswer`, `ArrayAnswer`, `GeoLocationAnswer` types and corresponding type guards for survey answers

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [v1.39.3] - 2026-06-12

### Added

- Add Oura activity and battery level data types

## [v1.39.2] - 2026-06-12

### Fixed

- Guard for decimal answers

## [v1.39.1] - 2026-06-06

### Added

- Add Oura heart health (cardiovascular age) data type

## [v1.39.0] - 2026-06-05

### Added

- Add Oura

## [v1.38.0] - 2026-06-03

### Added

- Config for `samsungSdkAcceleration` to record acceleration data in background on Galaxy Watch
- Support for withholding surveys, routines and displays from being published

## [v1.37.0] - 2026-05-30

### Added

- Add Google Health

## [v1.36.0] - 2026-05-28

### Changed

- Add Alt text to ContentBlock image

## [v1.35.0] - 2026-05-22

### Changed

- Survey multiplex type

## [v1.34.1] - 2026-05-19

### Fixed

- Rename `likert-scale` to `scale-likert`

## [v1.34.0] - 2026-05-18

### Added

- `likert-scale` input type

### Fixed

- `matrix-item` input type constant
- `scale_numeric` using `valueInteger` (question is defined as decimal)

## [v1.33.3] - 2026-05-18

### Changed

- Handle empty response for optional questions

## [v1.33.2] - 2026-05-18

### Fixed

- Decryption failing in browser environment

## [v1.33.1] - 2026-05-15

### Fixed

- Postal code response to FHIR

## [v1.33.0] - 2026-05-13

### Added

- Add matrix question type

## [v1.32.0] - 2026-05-13

### Added

- Support for groups and display in questionnaires

## [v1.31.1] - 2026-05-13

### Added

- `postal-code` input type

## [v1.31.0] - 2026-05-12

### Added

- `country` input type

## [v1.30.0] - 2026-04-30

### Added

- Slider orientation and input label

## [v1.29.1] - 2026-04-29

### Fixed

- generateStepGuard with date and offset

## [v1.29.0] - 2026-04-22

### Added

- Prepopulate extension

## [v1.28.0] - 2026-04-21

### Removed

- `reminder` configuration from Survey and Routine

## [v1.27.0] - 2026-03-27

### Added

- Annotation data type for SDK service to define the source of the data

## [v1.26.0] - 2026-03-23

### Added

- `multiplex` attribute to survey
- `context` to questionnaire response

## [v1.25.0] - 2026-03-13

### Added

- `list` question type

## [v1.24.0] - 2026-03-05

### Added

- Helpers for multi/single select "other" option

## [v1.23.0] - 2026-02-26

### Added

- `geo-location` input type

## [v1.22.1] - 2026-02-23

### Added

- optional fileName property to message and notification

## [v1.22.0] - 2026-02-09

### Added

- Support for Android Health Connect

## [v1.21.0] - 2026-02-03

### Added

- PublishedAt date to tasks
- Eligbility property to survey scoring
- Response and Date conditions
- Notification type

### Changed

- Split StepCondition into specific subtypes
- Refactored Guards and their usage according to new types

### Fixed

- Date parameter not being encoded for fetching responses

## [v1.20.1] - 2026-01-22

### Fixed

- QuestionnaireScore range calculation with unscored question

## [v1.20.0] - 2026-01-21

### Added

- Min field to QuestionnaireScore
- Function to calculate possible questionnaire score range
- TimeFuncs (handler for different frequency types)

### Removed

- Location in study definitions

## [v1.19.0] - 2025-12-11

### Added

- Handling of device registration for push notifications
- Fetching of response objects
- Types and FHIR conversion for Messages

## [v1.18.0] - 2025-11-14

### Added

- Support for questionnaire templates

### Changed

- Renamed method to generate FHIR questionnaire scores

## [v1.17.0] - 2025-11-13

### Added

- Support for Apple healthKit sleep

## [v1.16.0] - 2025-11-12

### Added

- Support for QuestionnaireScores

### Changed

- Renamed EligibilityScore to QuestionnaireScore to cover more use cases

## [v1.15.0] - 2025-11-07

### Added

- Theme option for programs

## [v1.14.1] - 2025-10-20

### Fixed

- RecursiveKeyOf of array types including undefined

## [v1.14.0] - 2025-10-17

### Removed

- Resting energy signal type from Apple HealthKit

## [v1.13.0] - 2025-10-10

### Added

- Sent date to Communication fhir resource and effectiveDate to SeenDisplay

## [v1.12.0] - 2025-09-25

### Added

- A short description if the study is featured

## [v1.11.0] - 2025-08-27

### Added

- `reminder` configuration to Survey and Routine

## [v1.10.2] - 2025-08-18

### Fixed

- Use RecursiveKeyOf for DisplayPath

## [v1.10.1] - 2025-08-15

### Changed

- Improve RecursiveKeyOf to work with arrays

## [v1.10.0] - 2025-07-24

### Fixed

- Displays correctly donate new block format

## [v1.9.0] - 2025-07-14

### Added

- New function `getRestorationSize()` to get amount and size of donations which can be restored

## [v1.8.0] - 2025-07-10

### Added

- Contact Information added to program

## [v1.7.1] - 2025-07-08

### Changed

- Make institute name optional

## [v1.7.0] - 2025-07-07

### Added

- Configuration for study landing page
- Support for institution and program image

## [v1.6.0] - 2025-06-25

### Changed

- Move `charts` on level higher in `Display` type

## [v1.5.1] - 2025-06-25

### Changed

- DEXCOM sandbox and prod urls switched to eu

## [v1.5.0] - 2025-06-23

### Added

- Support for chart configuration on displays

## [v1.4.0] - 2025-06-11

### Added

- Map from keys to devices and some data quantity types

## [v1.3.1] - 2025-05-28

### Fixed

- heart rate variability: `DEVICE_SIGNAL_TYPE` renamed to `hrv` to fit to `ProgramDevicesDataType`

## [v1.3.0] - 2025-05-23

### Changed

- RecordingSignal to FHIR now takes the data buffer instead of an array of RecordingSignalItems

## [v1.2.0] - 2025-05-20

### Added

- Apple healthKit data types and annotations

## [v1.1.2] - 2025-05-14

### Fixed

- Add id parameter to remaining FHIR generators

## [v1.1.1] - 2025-05-14

### Added

- `featured` flag to program

### Fixed

- FHIR representation of display labels in recording signals

## [v1.1.0] - 2025-05-08

### Changed

- Updated display types for recommendation refactoring

## [v1.0.0] - 2025-05-05

### Added

- Program and Device type definitions
- FHIR generation module
- Donation SDK including encryption protocols

[Unreleased]: https://github.com/gesundheitscloud/collect-lib/compare/v1.39.3...HEAD
[v1.39.3]: https://github.com/gesundheitscloud/collect-lib/compare/v1.39.2...v1.39.3
[v1.39.2]: https://github.com/gesundheitscloud/collect-lib/compare/v1.39.1...v1.39.2
[v1.39.1]: https://github.com/gesundheitscloud/collect-lib/compare/v1.39.0...v1.39.1
[v1.39.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.38.0...v1.39.0
[v1.38.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.37.0...v1.38.0
[v1.37.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.36.0...v1.37.0
[v1.36.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.35.0...v1.36.0
[v1.35.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.34.1...v1.35.0
[v1.34.1]: https://github.com/gesundheitscloud/collect-lib/compare/v1.34.0...v1.34.1
[v1.34.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.33.3...v1.34.0
[v1.33.3]: https://github.com/gesundheitscloud/collect-lib/compare/v1.33.2...v1.33.3
[v1.33.2]: https://github.com/gesundheitscloud/collect-lib/compare/v1.33.1...v1.33.2
[v1.33.1]: https://github.com/gesundheitscloud/collect-lib/compare/v1.33.0...v1.33.1
[v1.33.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.32.0...v1.33.0
[v1.32.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.31.1...v1.32.0
[v1.31.1]: https://github.com/gesundheitscloud/collect-lib/compare/v1.31.0...v1.31.1
[v1.31.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.30.0...v1.31.0
[v1.30.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.29.1...v1.30.0
[v1.29.1]: https://github.com/gesundheitscloud/collect-lib/compare/v1.29.0...v1.29.1
[v1.29.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.28.0...v1.29.0
[v1.28.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.27.0...v1.28.0
[v1.27.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.26.0...v1.27.0
[v1.26.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.25.0...v1.26.0
[v1.25.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.24.0...v1.25.0
[v1.24.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.23.0...v1.24.0
[v1.23.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.22.1...v1.23.0
[v1.22.1]: https://github.com/gesundheitscloud/collect-lib/compare/v1.22.0...v1.22.1
[v1.22.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.21.0...v1.22.0
[v1.21.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.20.1...v1.21.0
[v1.20.1]: https://github.com/gesundheitscloud/collect-lib/compare/v1.20.0...v1.20.1
[v1.20.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.19.0...v1.20.0
[v1.19.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.18.0...v1.19.0
[v1.18.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.17.0...v1.18.0
[v1.17.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.16.0...v1.17.0
[v1.16.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.15.0...v1.16.0
[v1.15.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.14.1...v1.15.0
[v1.14.1]: https://github.com/gesundheitscloud/collect-lib/compare/v1.14.0...v1.14.1
[v1.14.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.13.0...v1.14.0
[v1.13.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.12.0...v1.13.0
[v1.12.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.11.0...v1.12.0
[v1.11.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.10.2...v1.11.0
[v1.10.2]: https://github.com/gesundheitscloud/collect-lib/compare/v1.10.1...v1.10.2
[v1.10.1]: https://github.com/gesundheitscloud/collect-lib/compare/v1.10.0...v1.10.1
[v1.10.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.9.0...v1.10.0
[v1.9.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.8.0...v1.9.0
[v1.8.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.7.1...v1.8.0
[v1.7.1]: https://github.com/gesundheitscloud/collect-lib/compare/v1.7.0...v1.7.1
[v1.7.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.6.0...v1.7.0
[v1.6.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.5.1...v1.6.0
[v1.5.1]: https://github.com/gesundheitscloud/collect-lib/compare/v1.5.0...v1.5.1
[v1.5.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.4.0...v1.5.0
[v1.4.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.3.1...v1.4.0
[v1.3.1]: https://github.com/gesundheitscloud/collect-lib/compare/v1.3.0...v1.3.1
[v1.3.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.2.0...v1.3.0
[v1.2.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.1.2...v1.2.0
[v1.1.2]: https://github.com/gesundheitscloud/collect-lib/compare/v1.1.1...v1.1.2
[v1.1.1]: https://github.com/gesundheitscloud/collect-lib/compare/v1.1.0...v1.1.1
[v1.1.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.0.0...v1.1.0
[v1.0.0]: https://github.com/gesundheitscloud/collect-lib/releases/tag/v1.0.0
