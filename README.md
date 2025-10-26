# ElectronIM
[![GitHub license](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://github.com/manusa/electronim/blob/master/LICENSE)
[<img src="https://github.com/manusa/electronim/workflows/Tests/badge.svg" />](https://github.com/manusa/electronim/actions)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=manusa_electronim&metric=bugs)](https://sonarcloud.io/dashboard?id=manusa_electronim) 
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=manusa_electronim&metric=coverage)](https://sonarcloud.io/dashboard?id=manusa_electronim)
[![npm](https://img.shields.io/npm/v/electronim)](https://www.npmjs.com/package/electronim)
[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/manusa/electronim?sort=semver)](https://github.com/manusa/electronim/releases/latest)
[![electronim](https://snapcraft.io//electronim/badge.svg)](https://snapcraft.io/electronim)
[![Chocolatey Version](https://img.shields.io/chocolatey/v/electronim)](https://community.chocolatey.org/packages/electronim)


Free/Libre open source Electron based multi instant messaging (IM) client.

Combine all your IM applications (or whatever you want) in a single browser (Electron) window.

## Quickstart

Detailed guides for installation can be followed in our comprehensive [setup guide](docs/Setup.md).

Download the latest binary version for your platform:
[releases](https://github.com/manusa/electronim/releases/latest)

Or if you have Node installed in your system, you can try out ElectronIM by running one of the following commands:

```
npx electronim
```

```
npm install -g electronim
electronim
```

## Features

- ⚛ Multi-platform: ElectronIM is available for Linux 🐧, Mac 🍏 and Windows.
- 🌍 Based on Chromium 140.
- 🔔 Desktop notifications: ElectronIM will notify you using your native system notifications.
- 🧐 Spellchecker: ElectronIM contains spellchecker dictionaries for many languages,
  if your language is not supported, just [file an issue](https://github.com/manusa/electronim/issues/new).
- 🕸 Supports any web based IM solution.
- 👋 Drag-and-drop services/tab reordering.
- 🔒 Configurable context for services (Isolated/sandboxed or shared). i.e. You can have multiple tabs/instances of the same service/web application if the context is sandboxed.
- 🔕 Notifications can be disabled for individual Applications.
- 💤 Notifications can be disabled globally (Do not disturb).
- ⌨ Keyboard [shortcuts](docs/Keyboard-shortcuts.md).
- 🖥️ Screen sharing: Share your screen securely with any web service that supports it (e.g. Google Meet, Microsoft Teams, Zoom, and so on).
- 🎨 Appearance customization:
  - 🌗 Light and Dark themes with system override.
  - 🏷️ Custom application title to personalize your ElectronIM window.
- 🗕 System Tray.
- 📌 Always on top: Keep ElectronIM window on top of other applications.
- 🔎 Find in page.
- 📊 Task Manager: Monitor and manage application processes with memory and CPU usage metrics.
- 🚫 No tracking: ElectronIM respects your privacy, no account registration is needed and no telemetry, analytics, or tracking of any kind is performed.

## [Screenshot](docs/Screenshots.md)

![Screenshot](docs/screenshots/main.png)

## Motivation

Inspired by [Rambox](https://github.com/ramboxapp/community-edition) and [Franz](https://github.com/meetfranz/franz), I created **ElectronIM** out of the necessity for an all-in-one instant messaging app that did not require registration, provided spell checking for free, and ensured maximum user privacy by never tracking user activity or sending telemetry data.
With built-in screen sharing and strict privacy principles, ElectronIM offers a secure and flexible communication hub.

## Documentation

0. [Setup Guide](docs/Setup.md)
0. [Keyboard Shortcuts](docs/Keyboard-shortcuts.md)
0. [Troubleshooting](docs/Troubleshooting.md)

## Acknowledgements

- [Electron](https://electronjs.org/)
- [Preact](https://github.com/preactjs/preact)
- [Chrome tabs](https://github.com/adamschwartz/chrome-tabs#readme)
- [Nodehun](https://github.com/Wulf/nodehun/)
- [Woorm's dictionary repo](https://github.com/wooorm/dictionaries)
