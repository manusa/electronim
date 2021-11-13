# ElectronIM
[![GitHub license](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://github.com/manusa/electronim/blob/master/LICENSE)
[<img src="https://github.com/manusa/electronim/workflows/Tests/badge.svg" />](https://github.com/manusa/electronim/actions)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=manusa_electronim&metric=bugs)](https://sonarcloud.io/dashboard?id=manusa_electronim) 
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=manusa_electronim&metric=coverage)](https://sonarcloud.io/dashboard?id=manusa_electronim)
[![npm](https://img.shields.io/npm/v/electronim)](https://www.npmjs.com/package/electronim)
[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/manusa/electronim?sort=semver)](https://github.com/manusa/electronim/releases/latest)
[![electronim](https://snapcraft.io//electronim/badge.svg)](https://snapcraft.io/electronim)


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
- 🌍 Based on Chromium 95
- 🔔 Desktop notifications: ElectronIM will notify you using your native system notifications.
- 🧐 Spellchecker: ElectronIM contains spellchecker dictionaries for many languages,
  if your language is not supported, just [file an issue](https://github.com/manusa/electronim/issues/new).
- Supports any web based IM solution
- Drag-and-drop tab reordering
- 🔒 Configurable context for tabs (Isolated/sandboxed or shared). i.e. You can have multiple
  tabs/instances of the same service/web application if the context is sandboxed.
- 🔕 Notifications can be disabled for individual Applications
- 💤 Notifications can be disabled globally (Do not disturb)
- ⌨ Keyboard [shortcuts](docs/Keyboard-shortcuts.md)
- 🖥️ Screen sharing

## [Screenshot](docs/Screenshots.md)

![Screenshot](docs/screenshots/main.png)

## Motivation

Inspired by [Rambox](https://github.com/ramboxapp/community-edition) and
[Franz](https://github.com/meetfranz/franz), I created **ElectronIM** out of the necessity of
having an all-in-one instant messaging app that didn't require registration and provided 
spell checking for free.


## Documentation

0. [Setup Guide](docs/Setup.md)
0. [Keyboard Shortcuts](docs/Keyboard-shortcuts.md)
0. [Troubleshooting](docs/Troubleshooting.md)

## Acknowledgements

- [Electron](https://electronjs.org/)
- [Bulma](https://github.com/jgthms/bulma)
- [Preact](https://github.com/preactjs/preact)
- [Chrome tabs](https://github.com/adamschwartz/chrome-tabs#readme)
- [Font Awesome Free](https://github.com/FortAwesome/Font-Awesome)
- [Nodehun](https://github.com/Wulf/nodehun/)
- [Woorm's dictionary repo](https://github.com/wooorm/dictionaries)
