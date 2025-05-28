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

- heart rate variability: `DEVICE_SIGNAL_TYPE` renamed to `hrv` to fit to `ProgramDevicesDataType`

### Security

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

[Unreleased]: https://github.com/gesundheitscloud/collect-lib/compare/v1.3.0...HEAD
[v1.3.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.2.0...v1.3.0
[v1.2.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.1.2...v1.2.0
[v1.1.2]: https://github.com/gesundheitscloud/collect-lib/compare/v1.1.1...v1.1.2
[v1.1.1]: https://github.com/gesundheitscloud/collect-lib/compare/v1.1.0...v1.1.1
[v1.1.0]: https://github.com/gesundheitscloud/collect-lib/compare/v1.0.0...v1.1.0
[v1.0.0]: https://github.com/gesundheitscloud/collect-lib/releases/tag/v1.0.0
