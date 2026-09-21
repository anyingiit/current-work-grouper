# Current Work Grouper Constitution

Current Work Grouper is a Manifest V3 Chrome extension that moves newly opened, ungrouped
web pages into a tab group the user chooses. This constitution records the principles every
change to the extension MUST respect. Feature specs, plans and tasks produced with Spec Kit
are checked against it, and pull requests are reviewed against it.

## Core Principles

### I. Zero Dependencies

The extension and its tooling MUST NOT depend on third-party packages, at runtime or at
development time. The only requirements are a supported Chromium browser for the extension
and Node.js 20 or later for the checks. `package.json` MUST NOT gain `dependencies` or
`devDependencies`, and there MUST be no build step: the `extension/` folder is loaded into
Chrome exactly as it is committed. Linting, testing and packaging are plain Node.js scripts
under `scripts/` and `test/`.

Rationale: the project is small enough to audit by reading it. Every dependency would add
update churn, supply-chain exposure and a build step that makes "load unpacked" harder,
without buying anything the standard library does not already provide.

### II. Privacy and Least Privilege (NON-NEGOTIABLE)

The extension MUST make no network requests, inject no content scripts, request no `history`
or host permissions, send no telemetry and never persist URLs or page titles beyond the
short-lived pending tab IDs needed to finish a grouping. It MUST remain
`"incognito": "not_allowed"`. The permission list (`tabs`, `tabGroups`, `storage`) MUST NOT
grow unless a feature is impossible without the new permission; such a change MUST be
justified in the spec, called out in the changelog, and reflected in the "Permissions and
privacy" table of the README before it ships.

Rationale: the extension sees every URL the user opens. Users can only trust it if the
promise in the README ("no network requests, no content scripts, no stored browsing
history") stays literally true.

### III. Behavior Tests Against a Mocked Chrome API

Every change to grouping behavior, settings handling, localization or upgrade migration MUST
be covered by a test in `test/` that runs against the in-repo Chrome API mock, and `npm run
lint` and `npm test` MUST pass before a pull request is opened. Bug fixes MUST add a test
that fails before the fix and passes after it. Tests MUST exercise the real files in
`extension/` (loaded through `node:vm`) rather than copies of the logic, so that the test
suite and the shipped code cannot drift apart.

Rationale: the extension cannot be tested end to end in CI without a browser, and the
service worker's restart and race conditions are exactly where regressions hide. The mocked
API is the only automated safety net, so it has to cover every behavior the README promises.

### IV. The User's Choices Win

Grouping MUST never override something the user or another extension has already decided:
pinned tabs, tabs that are already in a group, tabs in incognito or non-normal windows,
browser and `file://` pages, and tabs that existed before installation MUST be left alone.
Changing the target group name MUST affect only tabs opened afterwards; existing groups MUST
NOT be renamed and existing tabs MUST NOT be moved. Pausing MUST take effect immediately and
persist across browser restarts. Grouping MUST be idempotent and fail safe: an attempt that
cannot complete leaves the tab where Chrome put it, reports the failure through the badge,
and never retries in a way that could move a tab twice.

Rationale: a tab manager that fights the user is worse than none. Predictable, documented
rules matter more than catching every edge case.

### V. Localization Parity, English First

Every user-facing string in the extension MUST go through `extension/i18n.js` and
`extension/_locales/`, and MUST exist in both `en` and `zh_CN` before a change is merged;
English is the source text and Simplified Chinese is translated from it. `_locales/en` is
the `default_locale` and the fallback for any unknown language. Repository documentation
follows the same rule: `README.md` is the source of truth, and any change to it MUST be
mirrored in `README.zh-CN.md` in the same pull request.

Rationale: half-translated interfaces and stale translated READMEs are the most common way a
bilingual project quietly breaks its promises to one group of users.

### VI. Documentation and Release Discipline

The README is the behavior specification that users read. Any change to grouping rules,
limitations, permissions, settings or the development workflow MUST update the matching
README section in the same pull request, and MUST NOT leave the README describing behavior
the extension no longer has. User-visible changes MUST be recorded under `Unreleased` in
`CHANGELOG.md` following Keep a Changelog. Releases follow Semantic Versioning: the version
in `extension/manifest.json` and `package.json` MUST match (the linter enforces this), and a
release is cut by moving the `Unreleased` entries under the new version and pushing a
`v<version>` tag.

Rationale: with no store listing and no in-app help, the README and changelog are the only
place users learn what the extension does and what changed.

## Technical Constraints

- **Platform**: Chrome extension Manifest V3, `minimum_chrome_version` 102 or later, with a
  background service worker and an action popup. No other browser targets are promised.
- **Service worker lifetime**: the worker can be terminated at any time. State that must
  survive a restart (pending tab IDs, settings) MUST live in `chrome.storage`; in-memory
  globals are caches only. Every listener MUST be registered synchronously at the top level
  so Chrome can wake the worker for it.
- **Storage**: durable settings (`groupName`, `enabled`, `language`) live in
  `chrome.storage.local`; short-lived pending work lives in `chrome.storage.session`. Stored
  data MUST remain forward compatible: upgrades MUST migrate or default missing keys and
  MUST NOT drop a user's saved group name.
- **Code style**: plain modern JavaScript, two-space indentation, UTF-8 and LF line endings
  as defined in `.editorconfig`. `extension/` contains no bundlers, transpilers or
  TypeScript.
- **Continuous integration**: every GitHub Actions step MUST be pinned to a full commit SHA
  with a version comment; the CI job enforces this. The workflow token stays read-only.

## Development Workflow

- **Spec-driven changes**: non-trivial features and behavior changes start with Spec Kit.
  `/speckit-specify` writes the spec under `specs/<number>-<name>/`, `/speckit-plan`
  produces the plan and passes the Constitution Check gate against this document,
  `/speckit-tasks` breaks it into tasks and `/speckit-implement` executes them. Typo fixes,
  documentation-only edits and one-line bug fixes MAY skip the spec and go straight to a
  pull request.
- **Branching and review**: work happens on a branch from `main` and lands through a pull
  request. A pull request MUST pass CI (lint and tests), MUST fill in the pull request
  template, and MUST be reviewed against this constitution. Principle II and Principle V
  violations block a merge outright.
- **Definition of done**: tests updated, `npm run lint` and `npm test` green, `README.md` and
  `README.zh-CN.md` updated when behavior or workflow changed, `CHANGELOG.md` updated when
  the change is user visible, and the change loaded once in Chrome as an unpacked extension
  when it touches the popup or grouping logic.
- **Security**: vulnerabilities are reported privately as described in `SECURITY.md`, never
  in public issues or pull requests.

## Governance

This constitution supersedes any other written or habitual practice in the repository. Where
`CONTRIBUTING.md` or the README and this document disagree, this document wins and the other
file MUST be corrected.

- **Amendments** are made by pull request that edits `.specify/memory/constitution.md`,
  states the reason for the change, and updates any template, skill or documentation that
  depended on the amended text. Amendments to Principle II require the maintainer's explicit
  approval in the pull request.
- **Versioning** of this document follows Semantic Versioning: MAJOR for removing or
  redefining a principle in a backward-incompatible way, MINOR for adding a principle or
  section or materially expanding guidance, PATCH for clarifications and wording.
- **Compliance review**: every `/speckit-plan` MUST complete the Constitution Check against
  the current version of this document, and any violation MUST be listed in the plan's
  Complexity Tracking table with the simpler alternative that was rejected. Reviewers MUST
  verify that a pull request satisfies the Definition of done above before merging.

**Version**: 1.0.0 | **Ratified**: 2026-09-21 | **Last Amended**: 2026-09-21
