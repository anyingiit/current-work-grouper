<!-- Source: Best-README-Template BLANK_README (Unlicense) — https://github.com/othneildrew/Best-README-Template -->

<a id="readme-top"></a>

**English** · [简体中文](README.zh-CN.md)

# Current Work Grouper

A Chrome extension that puts newly opened, ungrouped web pages — including links opened from other apps — into a tab group you choose, instead of at the far end of the tab strip.

[![CI](https://github.com/anyingiit/current-work-grouper/actions/workflows/ci.yml/badge.svg)](https://github.com/anyingiit/current-work-grouper/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/anyingiit/current-work-grouper)](LICENSE)

[Report a bug](https://github.com/anyingiit/current-work-grouper/issues/new?template=bug_report.yml) · [Request a feature](https://github.com/anyingiit/current-work-grouper/issues/new?template=feature_request.yml)

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#how-grouping-works">How grouping works</a></li>
    <li><a href="#known-limitations">Known limitations</a></li>
    <li><a href="#permissions-and-privacy">Permissions and privacy</a></li>
    <li><a href="#development">Development</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

## About The Project

When another app (Notes, a chat client, a mail client) opens a link in Chrome, the new tab always lands at the end of the tab strip. If you keep the pages you are working on in one tab group, you end up dragging every one of them in by hand.

This extension does that step for you:

- New, ungrouped web pages join a target group. The default name is `当前工作` ("current work"), and you can change it.
- An open group with the same name is reused; if there is none, a blue group is created.
- Click the toolbar icon to rename the target group or to pause and resume grouping.
- No network requests, no content scripts, no stored browsing history.

The extension's interface is in Simplified Chinese.

See the [open issues](https://github.com/anyingiit/current-work-grouper/issues) for planned features and known issues.

## Getting Started

### Prerequisites

- Google Chrome 102 or later (or another Chromium browser with tab groups)

### Installation

The extension is installed as an unpacked extension.

1. Download `current-work-grouper-v*.zip` from the [latest release](https://github.com/anyingiit/current-work-grouper/releases/latest) and unzip it somewhere permanent — Chrome loads it from that folder, so do not move or delete it afterwards. Alternatively, clone the repository and use its `extension/` folder.
2. Open `chrome://extensions` and turn on **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the folder that contains `manifest.json`.
4. Pin **当前工作 · 自动归组** from the puzzle-piece menu in the toolbar.

To update, replace the files in the same folder and click the reload button on the extension's card in `chrome://extensions`. Keeping the same folder keeps your settings.

## Usage

1. Click the toolbar icon, enter the target group name under **目标分组名称** (target group name), and click **保存设置** (save settings).
2. Click a web link in another app. The new tab appears in that group.
3. To pause, clear **开启自动归组** (enable auto-grouping) and save; the badge shows `OFF`. Check it and save again to resume (`ON`).

The name is trimmed, must not be empty, and is matched literally, so Chinese characters, spaces and symbols all work. Changing it only affects tabs opened afterwards; existing groups are not renamed and existing tabs are not moved.

## How grouping works

- A new HTTP or HTTPS page that is neither pinned nor already grouped joins the target group.
- A matching group in the new tab's own window is preferred. If the only match is in another window, the tab is moved there. Keep a single group with that name to avoid surprises.
- If no matching group is open, a new one is created. A saved group that is currently closed is not reopened.
- If the new tab was the active tab, the target group is expanded, and when the tab moved to another window, that window is focused.
- Incognito windows, non-normal windows, browser pages (`chrome://`), `file://` pages, and pinned or already grouped tabs are ignored. Tabs that were open before installation are left alone.
- When a new tab's URL arrives late, the extension waits for it for up to 10 seconds. A blank new tab you open by hand is not grouped when you later type an address into it.

## Known limitations

- On macOS, Chrome gives links opened from other apps an opener tab too, so the extension cannot reliably tell an external link from one opened inside the browser. It therefore takes **every** new, ungrouped web page, including bookmarks, pages opened from within the browser and restored ungrouped tabs. Pause the extension before restoring a large session if you do not want those grouped.
- When an external link reuses an already open blank tab, it may not be grouped.
- Dragging tabs or closing the target window at the wrong moment can make one grouping attempt fail. The tab stays where Chrome put it and the badge shows `!`. Pause and save, then enable and save again to reset it.

## Permissions and privacy

The extension requests three permissions:

| Permission | Used for |
|---|---|
| `tabs` | Reading the URL and state of new tabs |
| `tabGroups` | Finding, creating and updating tab groups |
| `storage` | Saving the group name, the on/off switch and short-lived pending tab IDs |

It makes no network requests, injects no content scripts, has no history permission, sends no telemetry and never stores URLs. Pausing or removing the extension does not undo groupings it already made.

Built on the Chrome extension APIs [`chrome.tabs`](https://developer.chrome.com/docs/extensions/reference/api/tabs) and [`chrome.tabGroups`](https://developer.chrome.com/docs/extensions/reference/api/tabGroups).

## Development

There are no third-party dependencies; you only need Node.js 20 or later.

```sh
git clone https://github.com/anyingiit/current-work-grouper.git
cd current-work-grouper
npm run lint      # syntax check and manifest validation
npm test          # behavior tests against a mocked Chrome API
npm run package   # builds dist/current-work-grouper-v<version>.zip
```

Load the `extension/` folder in `chrome://extensions` to try a change in Chrome.

To release, bump the version in both `extension/manifest.json` and `package.json`, move the `Unreleased` entries in [CHANGELOG.md](CHANGELOG.md) under the new version, and push a `v<version>` tag. The release workflow runs the checks, builds the zip and publishes a GitHub release with it attached.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for how to open an issue or a pull request, and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for the standards expected of everyone taking part.

Please do not report security issues in public issues or pull requests. [SECURITY.md](SECURITY.md) explains how to report them privately.

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

## Contact

Project link: [https://github.com/anyingiit/current-work-grouper](https://github.com/anyingiit/current-work-grouper)

<p align="right">(<a href="#readme-top">back to top</a>)</p>
