# Keyboard Shortcuts

| Key combination                                            | Description                    |
|------------------------------------------------------------|--------------------------------|
| `F11`                                                      | Toggle full screen.            |
| `Ctrl+r` `Cmd+r` `F5`                                      | Reload current tab.            |
| `Ctrl+f` `Cmd+f`                                           | Find in active tab.            |
| `Ctrl++` `Cmd++` <br /> `Ctrl+ScrollUp` `Cmd+ScrollUp`     | Zoom in.                       |
| `Ctrl+-` `Cmd+-` <br /> `Ctrl+ScrollDown` `Cmd+ScrollDown` | Zoom out.                      |
| `Ctrl+0` `Cmd+0`                                           | Reset zoom.                    |
| `Ctrl+Tab`                                                 | Jump to the next open tab.     |
| `Ctrl+Shift+Tab`                                           | Jump to the previous open tab. |
| `Ctrl+[1-9]` `Cmd+[1-9]`                                   | Jump to the tab at position #. |
| `Esc`                                                      | (in dialog) Close.             |

## Customizing Tab Shortcuts

The tab navigation shortcuts (`Ctrl+Tab` and `Ctrl+[1-9]`) can be customized to use different modifier keys.

### How to Customize

1. Open ElectronIM settings (open the menu and select " ⚙️ Settings")
2. Go to the "Keyboard" section in the settings
3. Modify the following fields:
   - **Tab Switch Modifier**: Changes the modifier for `Ctrl+[1-9]` shortcuts
   - **Tab Traverse Modifier**: Changes the modifier for `Ctrl+Tab` shortcuts
4. Click "Save" to apply your changes

### Supported Modifiers

- `Alt` - Alt key
- `Ctrl` or `Control` - Control key  
- `Meta` or `Command` - Meta/Command key (Cmd on Mac)

### Examples

- **Default**: `Ctrl+1` switches to tab 1, `Ctrl+Tab` cycles through tabs
- **Alt modifier**: Set both fields to "Alt" → `Alt+1` switches to tab 1, `Alt+Tab` cycles through tabs
- **Mixed**: Tab Switch = "Alt", Tab Traverse = "Meta" → `Alt+1` for switching, `Meta+Tab` for cycling

> **Note**: On Mac, Command key shortcuts (`Command+[1-9]`) will always work regardless of your custom settings (this will be changed in future versions).
