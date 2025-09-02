# Custom Keyboard Shortcuts Feature

This document describes the new custom keyboard shortcuts feature implemented to address issue #386.

## Feature Overview

The new keyboard shortcuts customization feature allows users to modify the modifier keys used for tab selection and tab traversal. Previously, ElectronIM only supported hardcoded `Ctrl+Num` and `Meta+Num` (Cmd+Num on Mac) for tab selection.

## New Capabilities

### Customizable Tab Switch Modifier
- **Default**: `Ctrl+1`, `Ctrl+2`, etc. to switch to specific tabs
- **Customizable**: Users can change to `Alt+1`, `Alt+2`, etc. or any supported modifier

### Customizable Tab Traverse Modifier  
- **Default**: `Ctrl+Tab` to cycle through tabs
- **Customizable**: Users can change to `Alt+Tab` or any supported modifier

### Supported Modifiers
- `Alt` - Alt key
- `Ctrl` / `Control` - Control key  
- `Meta` / `Command` - Meta/Command key (Mac)

## Implementation Details

### 1. New Settings Pane
A new "Keyboard" section has been added to the settings interface with:
- Text fields for tab switch and tab traverse modifiers
- Input validation to ensure only valid modifiers are accepted
- Helpful placeholder text showing default values
- Explanatory text describing functionality

### 2. Dynamic Key Binding System
The keyboard shortcuts system has been redesigned to:
- Read modifier preferences from settings instead of hardcoded values
- Dynamically create keyboard event mappings based on user preferences
- Reload shortcuts when settings are saved
- Maintain backward compatibility with empty settings

### 3. Mac Compatibility
- Always preserves Meta (Command) key functionality for Mac users
- Prevents conflicts when users customize modifiers on Mac systems

### 4. Settings Storage
Keyboard shortcuts are stored in the settings JSON with this structure:
```json
{
  "keyboardShortcuts": {
    "tabSwitchModifier": "",
    "tabTraverseModifier": ""
  }
}
```
Empty strings use the default `Ctrl` behavior.

## User Interface

The keyboard shortcuts settings are accessible through:
1. Open ElectronIM settings (gear icon or menu)
2. Click on the "Keyboard" tab in the navigation rail
3. Configure desired modifier keys in the text fields
4. Click "Save" to apply changes

## Code Changes Summary

### Files Modified
- `src/base-window/keyboard-shortcuts.js` - Made keyboard shortcuts dynamic and settings-aware
- `src/settings/index.js` - Added keyboard shortcuts to default settings
- `src/settings/settings.browser.mjs` - Added keyboard pane to settings UI
- `src/settings/settings.reducer.browser.mjs` - Added keyboard shortcuts selector
- Multiple test files - Updated to include keyboard shortcuts in expected data

### Files Added
- `src/settings/settings.keyboard.browser.mjs` - New keyboard shortcuts settings pane
- `src/settings/__tests__/settings.keyboard.browser.test.mjs` - Tests for keyboard functionality

## Testing

The implementation includes comprehensive tests:
- Unit tests for keyboard shortcut validation
- Integration tests for settings functionality
- All existing tests updated to handle the new keyboard shortcuts field
- 505 total tests passing

## Example Usage

1. **Default behavior** (empty settings):
   - `Ctrl+1` switches to tab 1
   - `Ctrl+Tab` cycles through tabs

2. **Custom Alt modifier**:
   - Set "Tab Switch Modifier" to "Alt"
   - Now `Alt+1` switches to tab 1
   - `Ctrl+1` no longer works (unless on Mac where Cmd+1 still works)

3. **Mixed configuration**:
   - Tab Switch Modifier: "Alt"
   - Tab Traverse Modifier: "Meta"
   - Results: `Alt+1` for tab switching, `Meta+Tab` for tab cycling

## Backward Compatibility

- Users with existing settings will see empty modifier fields (default behavior)
- No changes to existing keyboard shortcuts until user explicitly customizes them
- Mac users retain Command key functionality regardless of customization

## Architecture Benefits

1. **Minimal Changes**: Only modified essential files, following existing patterns
2. **Type Safety**: Uses existing validation and reducer patterns
3. **Extensible**: Framework supports adding more customizable shortcuts in the future
4. **Testable**: Comprehensive test coverage for all new functionality
5. **User-Friendly**: Clear interface with helpful guidance text