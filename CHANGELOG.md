# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

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

[Unreleased]: https://github.com/gesundheitscloud/collect-lib/compare/v1.10.2...HEAD
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
