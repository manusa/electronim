# ElectronIM Development Guide

ElectronIM is a free/libre open source Electron-based multi-instant messaging (IM) client that allows users to combine multiple messaging applications into a single browser window.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Requirements

- **Node.js**: v22.x (LTS) - [Download](https://nodejs.org/en/download/)
  Seems like newer Node.js versions (v24+) have some issues with Jest and native modules.

### Bootstrap and Setup
Run these commands to set up the development environment:
```bash
npm install  # Install dependencies - takes ~55 seconds
```

### Build and Bundle
- `npm run pretest` - Run linting (ESLint) and build bundles (webpack) - takes ~2 seconds
- `node webpack.js` - Build webpack bundles manually - takes ~2 seconds  
- `node webpack.js --no-lib` - Build bundles without library files for development
- `npm run build:linux` - Builds and bundles the application for Linux systems
- `npm run build:mac` - Builds and bundles the application for MacOS systems
- `npm run build:win` - Builds and bundles the application for Windows systems

### Testing
- `npm test` - Run full test suite - takes ~13 seconds, runs 627 tests. NEVER CANCEL - Set timeout to 30+ minutes.
- `npm run test:e2e` - Run end-to-end tests to verify application startup - takes ~10-15 seconds
- The project uses Jest with ECMAScript modules requiring the experimental VM modules flag for Node.js

### Running the Application
- `npm run prestart && npm start` - Build and run the Electron application locally
- In CI/headless environments: `DISPLAY=:99 ./node_modules/.bin/electron . --no-sandbox` 
- The application requires X11 display and may need sandbox disabled in CI environments
- **Global NPX usage**: `npx electronim` - Installs and runs the latest published version from npm registry

### Building Platform Packages
- `npm run build:linux` - Build Linux packages (AppImage, snap, tar.gz). NEVER CANCEL - May take 30+ minutes. Set timeout to 60+ minutes.
- `npm run build:mac` - Build macOS packages (dmg, tar.gz)  
- `npm run build:win` - Build Windows packages (zip, portable exe)
- **IMPORTANT**: Build commands fail in environments with network restrictions due to Electron header downloads (node-gyp attempting to download from https://www.electronjs.org/headers). Document this limitation if builds fail with "network connectivity" errors.

## Validation

### Pre-commit Validation
Always run these commands before committing changes:
- `npm run pretest` - Validates linting and successful bundle creation
- `npm test` - Ensures all tests pass
- `npm run test:e2e` - Validates application startup (optional, for major changes)
- The CI build (`.github/workflows/tests.yml`) will fail if linting or tests fail

### Manual Testing Scenarios
After making code changes, manually validate by:
1. **Application startup**: `npm start` - Should open the main window with tabs for configured services
2. **Settings configuration**: Open settings (first launch or menu), add messaging service URLs:
   - WhatsApp Web: `https://web.whatsapp.com`
   - Telegram Web: `https://web.telegram.org`  
   - Slack: `https://slack.com/signin`
3. **Spell checker validation**: In settings, enable/disable spell check languages and test in message inputs
4. **Tab functionality**: 
   - Switch between service tabs using Ctrl+Tab or clicking tab headers
   - Reload tabs with Ctrl+R
   - Test tab reordering by dragging tab headers
5. **Keyboard shortcuts**: Test F11 (fullscreen), Ctrl+f (find), Ctrl+[1-9] (jump to tab)
6. **Notifications**: Test that messaging notifications from services appear as system notifications

![Application Screenshot](docs/screenshots/main.png)

### Screenshots for Visual Validation
- `docs/screenshots/main.png` - Main application interface with multiple messaging tabs
- `docs/screenshots/settings-empty.png` - Empty settings dialog on first launch  
- `docs/screenshots/settings.png` - Settings with configured services and spell check options

### Browser Testing
The project includes browser tests using JSDOM and Testing Library:
- Browser test files use `.browser.test.mjs` extension
- Settings functionality can be tested at `src/settings/__tests__/settings.browser.test.mjs`

### End-to-End Testing
The project includes E2E tests to verify the complete Electron application stack:
- E2E tests use `--no-sandbox`, `--disable-gpu`, `--remote-debugging-port=9222` flags for CI compatibility
- Tests verify application starts without crashing, creates main window, and runs for several seconds
- Window verification uses DevTools output analysis to confirm successful rendering
- Process termination uses SIGKILL due to tray icon preventing graceful SIGTERM shutdown
- **Startup E2E Tests** (`src/__tests__/startup.test.e2e.js`) - Tests actual Electron application startup by spawning the full process

## Technical Architecture

### Key Technologies
- **Electron**: Desktop application framework 
- **Preact**: Lightweight React alternative for UI components
- **Webpack**: Module bundler for creating optimized bundles
- **Jest**: Testing framework with JSDOM environment
- **ESLint**: Code linting with custom configuration

### Project Structure
- `src/` - Main source code
  - `main/` - Electron main process logic
  - `tab-manager/` - Core tab and messaging functionality
  - `settings/` - Application settings and configuration UI
  - `about/` - About dialog and information
  - `chrome-tabs/` - Tab UI components based on Chrome tabs
  - `components/` - Reusable UI components (Material Design 3 style)
  - `spell-check/` - Spell checking functionality with multiple language support
- `.github/` - GitHub configuration files
  - `workflows/` - CI/CD workflows
- `bundles/` - Generated webpack bundles (not committed)
- `build-config/` - Platform-specific build configurations
  - `chocolateyInstall.ps1` - [PowerShell](https://blog.marcnuri.com/tag/powershell) installation script for [Chocolatey](https://chocolatey.org/) (Windows)
  - `chocolateyUninstall.ps1` - [PowerShell](https://blog.marcnuri.com/tag/powershell) installation script for [Chocolatey](https://chocolatey.org/) (Windows)
  - `electronim.desktop` - Desktop entry configuration (Linux)
  - `electronim.nuspec` - [Chocolatey](https://chocolatey.org/) Nuspec information file (should be updated whenever the README.md is updated) (Windows)
  - `electronim.spec` - Spec file to build the [Fedora COPR package](https://copr.fedorainfracloud.org/coprs/manusa/electronim) (Linux)
  - `entitlements.mac.plist` Contains the MacOS entitlements for the application (Mac)
  - `VERIFICATION.txt` - [Chocolatey](https://chocolatey.org/) Moderation verification file (Windows)
- `utils/` - Build and utility scripts
- `docs/` - Application documentation including setup guides and troubleshooting.
  These files are also accessible from within the application (they are bundled too).

### Important Files
- `package.json` - Dependencies and build scripts. Contains the electron-build configuration too.
- `webpack.js` - Webpack configuration and bundling logic
- `eslint.config.mjs` - ESLint configuration
- `src/index.js` - Electron main process entry point
- `bin.js` - CLI entry point for npm global installation

## Common Tasks

### Adding Dependencies
- Production dependencies: `npm install --save-exact <package>` 
- Development dependencies: `npm install --save-exact -D <package>`
- Always run `npm run pretest` after adding dependencies
- Pin dependencies to the patch version (i.e. don't reference dependencies using ~ or ^)

### Working with Settings
The settings system uses Preact components with Material Design 3 styling:
- Settings UI is at `src/settings/`
- Browser tests cover URL validation and settings persistence
- Settings include service tabs, spell check languages, and other configuration

### Spell Check System
- Supports 20+ languages using dictionary packages
- Dictionary files are included as npm dependencies (dictionary-*)
- Spell checking logic in `src/spell-check/`

### Testing Guidelines
- Tests are always located in nested `__tests__` directories next to the code they test
- Test files should follow existing patterns in `src/**/__tests__/`:
  - Global `describe` block to define the test suite: component or behavior being tested
  - Nested `describe` blocks for scenarios or behaviors being tested
  - Use `beforeEach` and `afterEach` for setup and teardown of the test environment
  - Use `test` blocks for individual test cases with descriptive names
  - Test blocks should have a single assertion or behavior being tested (the `beforeEach` can be used to perform the `act`or `when` step if needed, then the `test` block can just have the `assert` step)
  - Use `expect` assertions to validate outcomes
- Use JSDOM environment for browser component tests. These are the tests that have the `.browser.test.mjs` extension:
  - Use Testing Library for DOM interaction and assertions
- Mocking should be prevented as much as possible to ensure real behavior is tested
- The `src/__tests__/index.js` provides utilities to mock Electron APIs and test-prepared modules such as settings.
- Always test both valid and invalid input scenarios

## Timing Expectations

- **npm install**: ~55 seconds
- **Linting and bundling** (`npm run pretest`): ~2 seconds
- **Test suite** (`npm test`): ~13 seconds (627 tests)
- **Application startup**: ~3-5 seconds
- **Platform builds**: 10-20 minutes (network dependent)

NEVER CANCEL long-running build operations. They may appear to hang but are downloading dependencies or compiling native modules.

## Troubleshooting

## Troubleshooting

### Common Issues
- **Sandbox errors**: Use `--no-sandbox` flag in headless/CI environments. Error: "SUID sandbox helper binary was found, but is not configured correctly"
- **Display errors**: Requires X11 display (`DISPLAY=:99` with Xvfb in CI). Error: "Missing X server or $DISPLAY"
- **Network build failures**: Platform builds fail with "network connectivity" errors when downloading Electron headers from electronjs.org
- **ECMAScript modules**: Always use `NODE_OPTIONS=--experimental-vm-modules` for tests. Error: "Dynamic import() is not available in the configured target environment"

### Build Failure Examples  
```
Error: node-gyp failed to rebuild 'nodehun' - network connectivity issues
Solution: Document that builds require internet access to download Electron headers
```

### Development Tips
- The application stores settings in user config directory (`~/.config/electronim` on Linux)
- Chrome DevTools can be opened within the Electron app for debugging (F12)
- Settings dialog shows on first launch to configure messaging services
- Each messaging service runs in its own webview with isolated context
- Use `npm run pretest` before every commit to catch linting and build issues early

## Platform Support

ElectronIM supports:
- **Linux**: AppImage, Snap, tar.gz packages
- **macOS**: DMG and tar.gz for both x64 and arm64
- **Windows**: ZIP and portable executable

The application can aggregate services like WhatsApp Web, Telegram Web, Slack, and other web-based messaging platforms into a unified interface.

## Common Command Outputs

### Sample npm install Output
```
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
added 872 packages, and audited 873 packages in 55s
155 packages are looking for funding
5 vulnerabilities (1 low, 2 moderate, 2 high)
```

### Sample Test Output  
```
Test Suites: 47 passed, 47 total
Tests:       486 passed, 486 total  
Snapshots:   0 total
Time:        13.069 s
Coverage:    Lines: 96.8% | Functions: 94.2% | Branches: 89.4% | Statements: 96.8%
```
