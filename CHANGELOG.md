<!-- Source: Keep a Changelog 1.1.0 (MIT) — https://keepachangelog.com/en/1.1.0/ -->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Created from Chef's Pick OSS Starter v1.1.0.

## [Unreleased]

## [1.2.0] - 2026-09-21

### Added

- English interface, now the default, with a language menu in the popup to switch to Simplified Chinese. The toolbar tooltip follows the chosen language, and the extension name and description are localized for Chrome's display language.

### Changed

- The default target group name is `Current Work` in English and `当前工作` in Chinese. Users upgrading from an earlier version who never saved a name keep `当前工作`.

### Fixed

- Add a best-effort selection workaround for vertical tab strips that stay scrolled to the bottom after an active tab joins an existing group in the same window. Background tabs keep their selection, and intervening user selection changes are checked before restoring focus.

## [1.1.1] - 2026-09-21

### Fixed

- Links opened from other apps were skipped on macOS, because Chrome gives those tabs an opener tab. Every new, ungrouped HTTP/HTTPS page is now grouped, whether or not it has an opener.

## [1.1.0] - 2026-09-21

### Added

- Settings popup to choose the target group name (default `当前工作`) and to pause or resume grouping.

## [1.0.0] - 2026-09-21

### Added

- Move newly opened web pages into the `当前工作` tab group, creating it when it does not exist.

[Unreleased]: https://github.com/anyingiit/current-work-grouper/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/anyingiit/current-work-grouper/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/anyingiit/current-work-grouper/releases/tag/v1.1.1
[1.1.0]: https://github.com/anyingiit/current-work-grouper/releases/tag/v1.1.0
[1.0.0]: https://github.com/anyingiit/current-work-grouper/releases/tag/v1.0.0
